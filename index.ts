import { Transport } from "./src/transport/Transport.js";
import { CreateAuthHandler } from "./src/auth/AuthFactory.js";
import { getConfig } from "./src/config/env.js";
import { TransportError } from "./src/errors/TransportError.js";
import { RateLimitError } from "./src/errors/RateLimitError.js";
import { TimeoutError } from "./src/errors/TimeoutError.js";





// Load configuration from environment variables
const { baseURL, authType, credentials, oath2Config, redisConfig, accessTokenURL, companyName, companyId } = getConfig();

// Create an authentication handler
const authHandler = CreateAuthHandler(authType, credentials, oath2Config, accessTokenURL, redisConfig);

// Initialize the transport utility
const transport = new Transport({ baseURL, cacheTTL: 600 }, authHandler);

transport.addMiddleware(async (config) => {
    const token = await authHandler.getAccessToken();
    if (!token) return config;
    if (!config.headers) {
        config.headers = {};
    }
    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

transport.addMiddleware(async (config) => {
    const company = config?.headers?.['X-Custom-Request-Company'];
    const whichCompanyIdentifier = config?.headers?.['X-Custom-Request-Company-Identifier'];
    config.headers = config.headers ?? {}
    if (company) {
        if (whichCompanyIdentifier) {
            switch (whichCompanyIdentifier) {
                case 'Company-Name': {
                    config.params = config.params ?? {};
                    config.params.company = company;
                    config.headers['X-Custom-Params-Company-Command'] = 'Skip'
                    break;
                };
                case 'Company-Id': {
                    const splittedUrl = config?.url?.split("/");
                    if (splittedUrl && Array.isArray(splittedUrl)) {
                        const last = splittedUrl[splittedUrl.length - 1];
                        const url = `${splittedUrl.slice(0, -1).join("/")}/companies(${company})/${last}`;
                        config.url = url;
                        config.headers = config.headers ?? {}
                        config.headers['X-Custom-Params-Company-Command'] = 'Remove'
                    }
                    break;
                };
                default: {
                    config.headers['X-Custom-Params-Company-Command'] = 'Set'
                }
            }
        }
    } else {
        if (whichCompanyIdentifier) {
            switch (whichCompanyIdentifier) {
                case 'Company-Name': {
                    config.params = config.params ?? {};
                    config.params.company = companyName;
                    config.headers['X-Custom-Params-Company-Command'] = 'Skip'
                    break;
                };
                case 'Company-Id': {
                    const splittedUrl = config?.url?.split("/")
                    if (splittedUrl && Array.isArray(splittedUrl)) {
                        const last = splittedUrl[splittedUrl.length - 1];
                        const url = `${splittedUrl.slice(0, -1).join("/")}/companies(${companyId})/${last}`;
                        config.url = url;
                        config.headers = config.headers ?? {}
                        config.headers['X-Custom-Params-Company-Command'] = 'Remove'
                    }
                    break;
                };
                default: {
                    config.headers['X-Custom-Params-Company-Command'] = 'Set'
                }
            }
        }
    }
    return config;
});
export {
    Transport,
    CreateAuthHandler,
    getConfig,
    TransportError,
    RateLimitError,
    TimeoutError,
    transport
}
