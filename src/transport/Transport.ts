/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { AuthHandler } from '../auth/AuthHandler.js';
import { logger } from '../utils/logger.js';
import NodeCache from 'node-cache';
import Bottleneck from 'bottleneck';
import pino from 'pino';
import { RateLimitError } from '../errors/RateLimitError.js';
import { TimeoutError } from '../errors/TimeoutError.js';
import { TransportError } from '../errors/TransportError.js';
import { metrics } from '../utils/metrics.js';
import { configDotenv } from 'dotenv';


configDotenv();

/**
 * Trnasport Config interfacace
 */
export interface TransportConfig {
    baseURL: string;
    timeout?: number;
    cacheTTL?: number,
    maxSockets?: number,
    maxFreeSockets?: number
    company?: string
};

/**
 * Request Options Interface
 */
export interface RequestOptions {
    company?: string;
    data?: never;
    headers?: Record<string, string>;
    params?: never;
    primaryKey?: [string],
    useCache?: boolean;
};

/**
 * A class that handles HTTP transport operations with caching, rate limiting, and authentication capabilities.
 * 
 * @class Transport
 * 
 * @property {AuthHandler} authHandler - Handles authentication for requests
 * @property {string} baseURL - Base URL for all requests
 * @property {string} defaultCompany - Default company name for requests
 * @property {NodeCache} cache - Caching mechanism for requests
 * @property {Bottleneck} limiter - Rate limiter for requests
 * @property {Array<Function>} middleware - Array of middleware functions for request modification
 * @property {AxiosInstance} axiosInstance - Axios instance for making HTTP requests
 * @property {pino.Logger} logger - Logger instance for request/response logging
 * 
 * @method get<T> - Performs GET requests with optional caching
 * @method post<T> - Performs POST requests
 * @method patch<T> - Performs PATCH requests with primary key handling
 * @method put<T> - Performs PUT requests with primary key handling
 * @method delete<T> - Performs DELETE requests with primary key handling
 * @method cu<T> - Performs codeunit requests
 * @method batch<T> - Executes multiple requests in parallel or sequentially
 * @method filter - Creates OData filter query strings
 * @method clearCache - Clears cache for specific endpoint
 * @method clearAllCaches - Clears all cached data
 * 
 * @example
 * ```typescript
 * const transport = new Transport(config, authHandler);
 * 
 * // GET request with caching
 * const data = await transport.get<UserData>('/users', { id: 1 }, { useCache: true });
 * 
 * // POST request
 * const newUser = await transport.post<UserData>('/users', { name: 'John' });
 * 
 * // Batch request
 * const results = await transport.batch<UserData>([
 *   { method: 'GET', url: '/users/1' },
 *   { method: 'GET', url: '/users/2' }
 * ]);
 * ```
 * 
 * @throws {TransportError} When a request fails
 * @throws {RateLimitError} When rate limit is exceeded
 * @throws {TimeoutError} When request times out
 */
export class Transport {
    private authHandler: AuthHandler;
    private baseURL: string;
    private defaultCompany: string;
    private cache: NodeCache;
    private limiter: Bottleneck;
    private middleware: ((config: AxiosRequestConfig) => AxiosRequestConfig)[] = [];
    private axiosInstance: AxiosInstance;
    private logger: pino.Logger;

    constructor(config: TransportConfig, authHandler: AuthHandler) {
        this.baseURL = config.baseURL;
        this.defaultCompany = config.company || process.env.BC_COMPANY_NAME || '';
        this.cache = new NodeCache({ stdTTL: config.cacheTTL || 300 });
        this.limiter = new Bottleneck({
            maxConcurrent: config.maxSockets || 100,
            minTime: 100,
            maxConcurrentPerHost: config.maxSockets || 100,
        });
        this.logger = logger;
        this.authHandler = authHandler;
        this.axiosInstance = this.authHandler.authenticate({
            baseURL: this.baseURL,
            timeout: config.timeout || 30000, // 30 Seconds
            httpsAgent: new HttpsAgent({ maxSockets: config.maxSockets || 50, keepAlive: true }),
            httpAgent: new Agent({ maxSockets: config.maxSockets || 50, maxFreeSockets: config.maxFreeSockets || 20, keepAlive: true }),
        });

        this.axiosInstance.interceptors.request.use((config) => {
            this.logger.debug({ url: config.url, method: config.method, params: config.params }, 'Outgoing requests');
            if (config.params) {
                config.params = { ...config.params };
            }
            if (!config.params.company) {
                config.params.company = this.defaultCompany
            }
            return config;
        })
        // Reuest interceptor for retry logic
        this.axiosInstance.interceptors.response.use(async (response: AxiosResponse) => {
            this.logger.debug({
                url: response.config?.url,
                status: response.status,
            }, 'Incoming response');
            return response
        },
            async (error) => {
                const config = error.config;
                this.logger.debug({
                    url: error.config?.url,
                    status: error.response?.status,
                    message: error.message,
                });
                if (!config) {
                    return new TransportError(error.message, error.response?.status, error.response?.data);
                }
                if (config.retryCount) {
                    config.retryCount = 0;
                }
                if (config.retryCount < 3) {
                    config.retryCount++;
                    return new Promise((resolve) => setTimeout(() => resolve(this.axiosInstance(config)), 1000));
                }
                if (error.response?.status === 429) {
                    return new RateLimitError('Rate limit exceeded', 429, error.response?.headers['Retry-After']);
                }
                if (error.code === 'ECONNABORTED') {
                    return new TimeoutError('Request timed out', 408, error);
                }
                return new TransportError(error.message, error.response?.status, error.response?.data);
            })
    }

    // CRUD requests
    async get<T>(endpoint: string, queryParams?: Record<string, any>, options?: RequestOptions): Promise<T> {
        const cacheKey = this.getCacheKey(endpoint, queryParams, options);
        if (options?.useCache && this.cache.has(cacheKey)) {
            const cachedValue = this.cache.get<T>(cacheKey);
            if (cachedValue !== undefined) {
                return cachedValue;
            }
        }
        const response = await this.limitedRequest<T>({ method: 'GET', url: endpoint, params: queryParams, ...options });
        if (options?.useCache) {
            this.cache.set(cacheKey, response);
        }
        return response;
    }
    async post<T>(endpoint: string, payload?: any, options?: RequestOptions): Promise<T> {
        try {
            this.invalidateCache(endpoint, options);
            return await this.limitedRequest<T>({ url: endpoint, method: 'POST', data: payload, ...options });
        } catch (error) {
            throw new TransportError('Request failed', 500, error);
        }
    }
    async patch<T>(endpoint: string, payload?: any, options?: RequestOptions): Promise<T> {
        try {
            const primaryKeys = this.extractPrimaryKeys(payload, options?.primaryKey);
            const url = `${endpoint}(${primaryKeys.join(',')})`;
            if (options?.headers) {
                options.headers['If-Match'] = "*";
            } else {
                options = { ...options, headers: { 'If-Match': "*" } };
            }
            if (options.primaryKey) {
                for (const key of options.primaryKey) {
                    delete payload[key];
                }
            }
            return await this.limitedRequest<T>({ url, method: 'PATCH', data: payload, ...options });
        } catch (error) {
            throw new TransportError('Request failed', 500, error);
        }
    }
    async put<T>(endpoint: string, payload?: any, options?: RequestOptions): Promise<T> {
        try {
            const primaryKeys = this.extractPrimaryKeys(payload, options?.primaryKey);
            const url = `${endpoint}(${primaryKeys.join(',')})`;
            if (options?.headers) {
                options.headers['If-Match'] = "*";
            } else {
                options = { ...options, headers: { 'If-Match': "*" } };
            }
            if (options.primaryKey) {
                for (const key of options.primaryKey) {
                    delete payload[key];
                }
            }
            return await this.limitedRequest<T>({ url, method: 'PUT', data: payload, ...options });
        } catch (error) {
            throw new TransportError('Request failed', 500, error);
        }
    }
    async delete<T>(endpoint: string, payload?: any, options?: RequestOptions): Promise<T> {
        try {
            this.invalidateCache(endpoint, options);
            const primaryKeys = this.extractPrimaryKeys(payload, options?.primaryKey);
            const url = `${endpoint}(${primaryKeys.join(',')})`;
            if (options?.headers) {
                options.headers['If-Match'] = "*";
            } else {
                options = { ...options, headers: { 'If-Match': "*" } };
            }
            return await this.limitedRequest<T>({ url, method: 'DELETE', data: payload, ...options });
        } catch (error) {
            throw new TransportError('Request failed', 500, error);
        }
    }
    // Dedicated  codeUnit request method
    /**
     * Makes a POST request to a codeunit endpoint with optional payload and request options
     * @template T - The expected response type
     * @param {string} codeunit - The codeunit endpoint URL
     * @param {any} [payload] - Optional request payload/body data
     * @param {RequestOptions} [options] - Optional request configuration options
     * @returns {Promise<T>} Promise that resolves with the response data
     * @throws {TransportError} When the request fails with status code 500
     */
    async cu<T>(codeunit: string, payload?: any, options?: RequestOptions): Promise<T> {
        try {
            return await this.limitedRequest<T>({ url: codeunit, method: 'POST', data: payload, ...options });
        } catch (error) {
            throw new TransportError('Request failed', 500, error);
        }
    }
    /**
     * Executes multiple HTTP requests in parallel or sequentially
     * @template T - The expected response type for all requests
     * @param request - Array of Axios request configurations to be executed
     * @param dependent - If true, requests are executed sequentially and will fail if any request fails.
     *                   If false, requests are executed in parallel and failures are filtered out.
     * @returns Promise resolving to an array of successful responses of type T
     * @throws {TransportError} When all requests fail or dependent requests have a failure
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
     */
    async batch<T>(request: AxiosRequestConfig[], dependent: boolean = false): Promise<T[]> {
        try {
            if (dependent) {
                return await Promise.all(request.map(async (req) => await this.limitedRequest<T>(req)));
            } else {
                const results = await Promise.allSettled(request.map(async (req) => await this.limitedRequest<T>(req)));
                return results
                    .filter((result): result is PromiseFulfilledResult<Awaited<T>> => result.status === 'fulfilled')
                    .map(result => result.value);
            }
        } catch (error) {
            throw new TransportError("Batch request failed", 500, error);
        }
    }


    private prepareString(key: string, value: any, isString: boolean = false): string {
        let query: string = ''
        if (isString) {
            query = `${key} eq '${value}'`;
        } else {
            query = `${key} eq ${value}`;
        }
        return query;
    }
    private isValidDate(dateString: string) {
        return !isNaN(new Date(dateString).getTime())
    }
    // Preparing BC 365 filter query from request query params
    /**
     * Creates an OData filter query string from the provided parameters
     * @param params - An object containing key-value pairs to be converted into filter conditions
     * @returns An object with the '$filter' property containing the generated OData filter string, or undefined if no valid parameters
     * @throws {TransportError} When there is an error preparing the BC 365 filter query
     * 
     * @remarks
     * - Handles different value types and formats them appropriately for OData filtering
     * - Special handling for date strings vs regular strings
     * - Combines multiple conditions with 'and' operator
     * - Empty or falsy values are skipped
     * 
     * @example
     * ```typescript
     * filter({ name: "John", age: 30 })
     * // Returns: { $filter: "name eq 'John' and age eq 30" }
     * ```
     */
    filter(params: Record<string, any>): object | undefined {
        try {
            if (typeof params === 'object') {
                let filter: string = '';
                const queryarray = []
                for (const [key, value] of Object.entries(params)) {
                    if (!value) continue
                    // get type of value
                    const type = typeof value;
                    if (type === 'string') {
                        if (this.isValidDate(value)) {
                            queryarray.push(this.prepareString(key, value, false));
                        } else {
                            queryarray.push(this.prepareString(key, value, true));
                        }
                    } else {
                        queryarray.push(this.prepareString(key, value));
                    }
                }
                if (queryarray.length) {
                    filter = queryarray.join(' and ');
                }
                return {
                    $filter: filter,
                };
            }
            return undefined;
        } catch (error) {
            return new TransportError('Error preparing BC 365 filter query', 500, error);
        }
    }
    private addMiddleware(middleware: (config: AxiosRequestConfig) => AxiosRequestConfig): void {
        this.middleware.push(middleware);
    }
    // Clear cache for specific key
    clearCache(endpoint: string, options?: RequestOptions): void {
        const cacheKey = this.getCacheKey(endpoint, undefined, options);
        this.cache.del(cacheKey);
    }
    // Clear all cache
    clearAllCaches(): void {
        this.cache.flushAll();
    }
    // Cache managment
    private getCacheKey(endpoint: string, queryParams?: Record<string, any>, options?: RequestOptions): string {
        const company = options?.company || this.defaultCompany;
        const params = queryParams ? JSON.stringify(queryParams) : '';
        return `${endpoint}:${company}:${params}`;
    }
    // Invalidate cache
    private invalidateCache(endpoint: string, options?: RequestOptions): void {
        const cacheKey = this.getCacheKey(endpoint, undefined, options);
        this.cache.del(cacheKey);
    }
    private isUUID(str: string): boolean {
        if (typeof str !== 'string') return false
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
        return uuidRegex.test(str)
    }
    private extractPrimaryKeys(payload: any, primaryKeys?: string[]): string[] {
        if (!primaryKeys) {
            throw new TransportError('Primary key property must be specified for PATCH, PUT, or DELETE requests.', 400);
        }
        const keys = primaryKeys.map((key) => {
            if (typeof payload[key] === 'string') {
                if (this.isValidDate(payload[key])) {
                    return `${key}=${payload[key]}`
                }
                if (this.isUUID(payload[key])) {
                    return `${key}=${payload[key]}`
                }
                return `${key}='${payload[key]}'`;
            }
            return `${key}=${payload[key]}`;
        });
        return keys;
    }
    private async limitedRequest<T>(config: AxiosRequestConfig): Promise<T> {
        return this.limiter.schedule(() => this.request<T>(config));
    }
    private async request<T>(config: AxiosRequestConfig): Promise<T> {
        // Appy middleware
        for (const middleware of this.middleware) {
            config = middleware(config);
        }
        try {
            const reponse = await this.axiosInstance.request<T>(config);
            metrics.increment('requests.success');
            return reponse.data;
        } catch (error) {
            metrics.increment('requests.error');
            throw error;
        }
    }
}