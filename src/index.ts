import { Transport } from "./transport/Transport.js";
import { CreateAuthHandler } from "./auth/AuthFactory.js";
import { getConfig } from "./config/env.js";
import { TransportError } from "./errors/TransportError.js";
import { RateLimitError } from "./errors/RateLimitError.js";
import { TimeoutError } from "./errors/TimeoutError.js";

// Load configuration from environment variables
const { baseURL, authType, credentials } = getConfig();

// Create an authentication handler
const authHandler = CreateAuthHandler(authType, credentials);

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
