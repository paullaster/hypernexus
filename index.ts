import { Transport } from "./src/transport/Transport.js";
import { CreateAuthHandler } from "./src/auth/AuthFactory.js";
import { getConfig } from "./src/config/env.js";
import { TransportError } from "./src/errors/TransportError.js";
import { RateLimitError } from "./src/errors/RateLimitError.js";
import { TimeoutError } from "./src/errors/TimeoutError.js";

// Load configuration from environment variables
const { baseURL, authType, credentials, oath2Config, redisConfig, accessTokenURL } = getConfig();

// Create an authentication handler
const authHandler = CreateAuthHandler(authType, credentials, oath2Config, accessTokenURL, redisConfig);

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
