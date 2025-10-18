import dotenv from "dotenv";
import { OAuth2Config, RedisConfig } from "../auth/handlers/OAuth2AuthHandler.js";
/**
 * Load environment variables
 */
dotenv.config();

export type AuthTypes = 'ntlm' | 'basic' | 'oauth2';
/**
 * EnvConfig Interface
 */
export interface EnvConfig {
    baseURL: string;
    authType: AuthTypes;
    companyName?: string;
    companyId?: string;
    tenantId?: string;
    credentials: {
        username: string;
        password: string;
        domain?: string;
    },
    redisConfig?: RedisConfig;
    oath2Config?: OAuth2Config;
    accessTokenURL?: string;
}


/**
 * Get EnvConfig
 */
export const getConfig = (): EnvConfig => {
    const tenantId = process.env.MICROSOFT_TENANT_ID;
    const baseURL = process.env.BC_API_BASE_URL!
    const authType: AuthTypes = (process.env.BC_AUTH_TYPE as AuthTypes) || 'ntlm' as AuthTypes;
    const companyName = process.env.BC_COMPANY_NAME || '';
    const companyId = process.env.BC_COMPANY_ID || '';
    const accessTokenURL = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const credentials = {
        username: process.env.BC_USERNAME || '',
        password: process.env.BC_PASSWORD || '',
        domain: process.env.BC_DOMAIN || '',
    };

    const oath2Config: OAuth2Config = {
        client_id: process.env.MICROSOFT_DYNAMICS_SAS_CLIENT_ID || "",
        client_secret: process.env.MICROSOFT_DYNAMICS_SAS_CLIENT_SECRET || "",
        grant_type: process.env.MICROSOFT_DYNAMICS_SAS_GRANT_TYPE || 'client_credentials',
        scope: process.env.MICROSOFT_DYNAMICS_SAS_SCOPE || 'https://api.businesscentral.dynamics.com/.default',
    };

    const redisConfig: RedisConfig = {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || '127.0.0.1',
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
    };

    if (!credentials.username || !credentials.password) {
        throw new Error('BC_USERNAME and BC_PASSWORD are required');
    }
    return {
        baseURL,
        authType,
        companyName,
        companyId,
        credentials,
        redisConfig,
        oath2Config,
        tenantId,
        accessTokenURL,
    };
}