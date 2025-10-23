import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { AxiosRequestConfig as ThirdPartyAxiosRequestConfig } from "axios-ntlm";
import { AuthHandler } from "../AuthHandler.js";
import axios from "axios";
import IORedis, { Redis } from "ioredis";
// import { Worker } from "bullmq";

export interface OAuth2Config {
    scope: string;
    client_id: string;
    client_secret: string;
    grant_type: string;
};

export interface OAuth2Response {
    token_type: string;
    expires_in: number;
    ext_expires_in: number,
    access_token: string
}

export interface RedisConfig {
    port: number;
    host: string;
    username?: string;
    password?: string;
    db?: number;
}


export class OAuth2Handler implements AuthHandler {
    private redisConnection: IORedis.Redis;
    private accessToken: string | null;
    constructor(private config: OAuth2Config, private accessTokenURL: string, redisConfig: RedisConfig | null = null) {
        if (redisConfig) {
            this.redisConnection = new Redis(redisConfig);
        } else {
            this.redisConnection = new Redis();
        }
        this.accessToken = null;
    }
    async getAccessToken(): Promise<OAuth2Response | null> {
        let data = null;
        const cachedAccessToken = await this.redisConnection.get('microsoft-bc-oauth2-access-token');
        data = {
            token_type: 'client_credentials',
            expires_in: 3599,
            ext_expires_in: 3599,
            access_token: cachedAccessToken,
        } as OAuth2Response;
        if (cachedAccessToken) {
            this.accessToken = cachedAccessToken;
        } else {
            const params = new URLSearchParams({
                ...this.config,
            });
            const { data: tokenResponse } = await axios.post<OAuth2Response>(this.accessTokenURL, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            data = tokenResponse;
            await this.redisConnection.del('microsoft-bc-oauth2-access-token');
            await this.redisConnection.set('microsoft-bc-oauth2-access-token', data.access_token, "EX", data.expires_in);
            this.accessToken = data.access_token;
        }
        return data
    }
    authenticate(config: ThirdPartyAxiosRequestConfig): AxiosInstance {
        if (!config.headers) {
            config.headers = {};
        }
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        config.headers['Accept'] = `application/json`;
        return axios.create(config as AxiosRequestConfig) as AxiosInstance;
    }
}