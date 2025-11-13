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
    companyUse: string;
    tenantId?: string;
    credentials: {
        username: string;
        password: string;
        domain?: string;
    },
    redisConfig?: RedisConfig;
    oauth2Config?: OAuth2Config;
    oath2Config?: OAuth2Config;
    accessTokenURL?: string;
}


/**
 * Get EnvConfig
 */
export const getConfig = (): EnvConfig => {
    const tenantId = process.env.MICROSOFT_TENANT_ID ?? '';
    const baseURL = process.env.BC_API_BASE_URL || 'https://<your-domain>';
    const authType: AuthTypes = (process.env.BC_AUTH_TYPE as AuthTypes) || 'ntlm';
    const companyName = process.env.BC_COMPANY_NAME ?? '';
    const companyId = process.env.BC_COMPANY_ID ?? '';
    const companyUse = process.env.BC_COMPANY_USE ?? 'Company-Name';
    const accessTokenURL = tenantId ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token` : undefined;
    const credentials = {
        username: process.env.BC_USERNAME ?? '',
        password: process.env.BC_PASSWORD ?? '',
        domain: process.env.BC_DOMAIN ?? '',
    };

    const oauth2Config: OAuth2Config = {
        client_id: process.env.MICROSOFT_DYNAMICS_SAS_CLIENT_ID || "",
        client_secret: process.env.MICROSOFT_DYNAMICS_SAS_CLIENT_SECRET || "",
        grant_type: process.env.MICROSOFT_DYNAMICS_SAS_GRANT_TYPE || 'client_credentials',
        scope: process.env.MICROSOFT_DYNAMICS_SAS_SCOPE || 'https://api.businesscentral.dynamics.com/.default',
    };

    // backward-compatible alias (preserve existing property name)
    const oath2Config = oauth2Config;

    const redisConfig: RedisConfig = {
        port: Number(process.env.REDIS_PORT || 6379),
        host: process.env.REDIS_HOST || '127.0.0.1',
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB || 0),
    };

    // Credentials required for non-oauth2 auth types
    if (authType !== 'oauth2' && (!credentials.username || !credentials.password)) {
        throw new Error('BC_USERNAME and BC_PASSWORD are required for ntlm/basic auth types');
    }

    // For oauth2 ensure required oauth envs are present
    if (authType === 'oauth2') {
        const missing: string[] = [];
        if (!tenantId) missing.push('MICROSOFT_TENANT_ID');
        if (!oauth2Config.client_id) missing.push('MICROSOFT_DYNAMICS_SAS_CLIENT_ID');
        if (!oauth2Config.client_secret) missing.push('MICROSOFT_DYNAMICS_SAS_CLIENT_SECRET');
        if (!oauth2Config.scope) missing.push('MICROSOFT_DYNAMICS_SAS_SCOPE');
        if (missing.length) {
            throw new Error(`Missing required OAuth2 environment variables: ${missing.join(', ')}`);
        }
    }

    return {
        baseURL,
        authType,
        companyName,
        companyId,
        companyUse,
        credentials,
        redisConfig,
        oauth2Config,
        oath2Config,
        tenantId,
        accessTokenURL,
    };
}