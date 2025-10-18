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

interface OAuth2Response {
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
    constructor(private config: OAuth2Config, private accessTokenURL: string, redisConfig: RedisConfig | null = null) {
        if (redisConfig) {
            this.redisConnection = new Redis(redisConfig);
        } else {
            this.redisConnection = new Redis();
        }
    }
    async getAccessToken(): Promise<string> {
        let accessToken = null;
        const cachedAccessToken = await this.redisConnection.get('microsoft-bc-oauth2-access-token');
        if (cachedAccessToken) {
            accessToken = cachedAccessToken;
        } else {
            const params = new URLSearchParams({
                ...this.config,
            });
            const { data } = await axios.post<OAuth2Response>(this.accessTokenURL, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            await this.redisConnection.set('microsoft-bc-oauth2-access-token', data.access_token, "EX", data.expires_in);
            accessToken = data.access_token;
        }
        return accessToken
    }
    authenticate(config: ThirdPartyAxiosRequestConfig): AxiosInstance {
        const accessToken = this.getAccessToken();
        if (!config.headers) {
            config.headers = {};
        }
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        config.headers['Accept'] = `application/json`;
        return axios.create(config as AxiosRequestConfig) as AxiosInstance;
    }
}