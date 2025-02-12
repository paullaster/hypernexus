/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Agent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { AuthHandler } from '../auth/AuthHandler.ts';
import { logger } from '../utils/logger.ts';
import NodeCache from 'node-cache';
import Bottleneck from 'bottleneck';
import pino from 'pino';
import { RateLimitError } from '../errors/RateLimitError.ts';
import { TimeoutError } from '../errors/TimeoutError.ts';
import { TransportError } from '../errors/TransportError.ts';
import { metrics } from '../utils/metrics.ts';


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
        this.defaultCompany = config.company || '';
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
            if (config.params) {
                config.params = {...config.params};
            }
            return config;
        })
        // Reuest interceptor for retry logic
        this.axiosInstance.interceptors.response.use(async (response: AxiosResponse) => response,

            async (error) => {
                const config = error.config;
                if (!config) {
                    throw new TransportError(error.message, error.response?.status, error.response?.data);
                }
                if (!config.retryCount) {
                    config.retryCount = 0;
                }
                if (config.retryCount < 3) {
                    config.retryCount++;
                    return new Promise((resolve) => setTimeout(() => resolve(this.axiosInstance(config)), 1000));
                }
                if (error.response?.status === 429) {
                    throw new RateLimitError('Rate limit exceeded', error.response?.headers['Retry-After']);
                }
                if (error.code === 'ECONNABORTED') {
                    throw new TimeoutError('Request timed out');
                }
                throw new TransportError(error.message, error.response?.status, error.response?.data);
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
    async cu<T>(codeunit: string, payload?: any, options?: RequestOptions): Promise<T> {
        try {
            return await this.limitedRequest<T>({ url: codeunit, method: 'POST', data: payload, ...options });
        } catch (error) {
            throw new TransportError('Request failed', 500, error);
        }
    }
    // Batch Requests
    async batch<T>(request: AxiosRequestConfig[]): Promise<T[]> {
        try {
            const responses = await Promise.all(request.map(async (req) => await this.limitedRequest<T>(req)));
            return responses;
        } catch (error) {
            throw new TransportError("Batch request failed", 500, error);
        }
    }
    addMiddleware(middleware: (config: AxiosRequestConfig) => AxiosRequestConfig): void {
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
    private extractPrimaryKeys(payload: any, primaryKeys?: string[]): string[] {
        if (!primaryKeys) {
            throw new TransportError('Primary key property must be specified for PATCH, PUT, or DELETE requests.', 400);
        }
        const keys = primaryKeys.map((key) => {
            if (typeof payload[key] === 'string') {
                return `${key}='${payload[key]}'`;
            }
            return key = payload[key]
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