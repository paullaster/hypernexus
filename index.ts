import { Transport } from "./src/transport/Transport";
import { CreateAuthHandler } from "./src/auth/AuthFactory";
import { getConfig } from "./src/config/env";
import { TransportError } from "./src/errors/TransportError";
import { RateLimitError } from "./src/errors/RateLimitError";
import { TimeoutError } from "./src/errors/TimeoutError";

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
