import { Transport } from "./src/transport/Transport.js";
import { CreateAuthHandler } from "./src/auth/AuthFactory.js";
import { getConfig } from "./src/config/env.js";
import { TransportError } from "./src/errors/TransportError.js";
import { RateLimitError } from "./src/errors/RateLimitError.js";
import { TimeoutError } from "./src/errors/TimeoutError.js";
import { ioRedisClient } from "./src/queues/OAuth2Token.js";
import "./src/job/oauth2-token-generation-worker.js";
import { scheduleAccessTokenRefresh } from "./src/queues/OAuth2Token.js";
import { OAuth2Handler } from "./src/auth/handlers/OAuth2AuthHandler.js";





// Load configuration from environment variables
const { baseURL, authType, credentials, oath2Config, redisConfig, accessTokenURL } = getConfig();

// Create an authentication handler
const authHandler = CreateAuthHandler(authType, credentials, oath2Config, accessTokenURL, redisConfig);

if (authType === 'oauth2') {
    if (oath2Config && accessTokenURL) {
        const oauth2Client = new OAuth2Handler(oath2Config, accessTokenURL, redisConfig);
        try {
            const data = await oauth2Client.getAccessToken();
            if (data?.access_token && data?.expires_in) {
                const expirationTime = data.expires_in - 10;
                await ioRedisClient.del('next-job-time-for-oauth2-access-token');
                await ioRedisClient.set(
                    'next-job-time-for-oauth2-access-token',
                    JSON.stringify(expirationTime),
                    'EX',
                    expirationTime
                );
            } else {
                console.log("Invalid token");
            }
        } catch (error) {
            console.error(error);
        }
    }
    (async () => {

        await scheduleAccessTokenRefresh();
    })();
}

// Initialize the transport utility
const transport = new Transport({ baseURL, cacheTTL: 600 }, authHandler);

export {
    Transport,
    CreateAuthHandler,
    getConfig,
    TransportError,
    RateLimitError,
    TimeoutError,
    transport
}
