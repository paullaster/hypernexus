import { AuthHandler } from "./AuthHandler.js";
import { NTLMAuthHandler } from "./handlers/NTLMAuthHandler.js";
import { BasicAuthHandler } from "./handlers/BasicAuthHandler.js";
import { OAuth2Config, OAuth2Handler, RedisConfig } from "./handlers/OAuth2AuthHandler.js";
import { AuthTypes } from "../config/env.js";

export interface Credentials {
    username: string;
    password: string;
    domain?: string;
};

/**
 * Create AuthHandler Factory
 */
export function CreateAuthHandler(type: AuthTypes, credentials: Credentials, oath2Config: OAuth2Config | null = null, accesTokenURL: string | null = null, redisConfig: RedisConfig | null = null): AuthHandler {
    switch (type.toString().trim().toLowerCase()) {
        case 'basic':
            return new BasicAuthHandler(credentials.username, credentials.password);
        case 'ntlm':
            return new NTLMAuthHandler({ username: credentials.username, password: credentials.password, domain: credentials.domain || '' });
        case 'oauth2':
            if (!oath2Config || !accesTokenURL) {
                throw new Error("Invalid configuration for OAuth2 authentication mode");
            }
            return new OAuth2Handler(oath2Config, accesTokenURL, redisConfig);
        default:
            throw new Error(`Unsupported authentication type: ${type}`);
    }
}