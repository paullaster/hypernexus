import { Transport } from "./src/transport/Transport.js";
import { CreateAuthHandler } from "./src/auth/AuthFactory.js";
import { getConfig } from "./src/config/env.js";
import { TransportError } from "./src/errors/TransportError.js";
import { RateLimitError } from "./src/errors/RateLimitError.js";
import { TimeoutError } from "./src/errors/TimeoutError.js";
import { modifyRequestCompanyConfig } from "./src/interfaces/middleware/ModifyRequestCompanyInformation.js";
import { setRuntimeCompanyConfigHeaders } from "./src/interfaces/middleware/SetRuntimeCompanyConfigHeaders.js";





// Load configuration from environment variables
const { baseURL, authType, credentials, oath2Config, redisConfig, accessTokenURL, companyName, companyId, companyUse } = getConfig();

// Create an authentication handler
const authHandler = CreateAuthHandler(authType, credentials, oath2Config, accessTokenURL, redisConfig);


const companyPreferIdentifier: { [key: string]: string | undefined } = {
    'Company-Name': companyName,
    'Company-Id': companyId,
    'Url-Complete': 'complete-url',
};

// Initialize the transport utility
const transport = new Transport({ company: companyPreferIdentifier[companyUse], baseURL, cacheTTL: 600 }, authHandler);


if (authType === 'oauth2' && !oath2Config && !accessTokenURL && !redisConfig) {
    throw new Error("[OAuth2]: Invalid OAuth2 configuration in the environment file.", {
        cause: 'Invalid Configuration',
    });
}

if (authType === 'oauth2') {
    transport.addMiddleware(async (config) => {
        const token = await authHandler.getAccessToken();
        if (!token) return config;
        if (!config.headers) {
            config.headers = {};
        }
        config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    });
}

transport.addMiddleware(setRuntimeCompanyConfigHeaders({ companyName, companyId, companyUse }));

transport.addMiddleware(modifyRequestCompanyConfig({ companyName, companyId }));


export {
    Transport,
    CreateAuthHandler,
    getConfig,
    TransportError,
    RateLimitError,
    TimeoutError,
    transport
}
