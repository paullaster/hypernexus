import { Transport } from "./src/transport/Transport.js";
import { CreateAuthHandler } from "./src/auth/AuthFactory.js";
import { getConfig } from "./src/config/env.js";
import { TransportError } from "./src/errors/TransportError.js";
import { RateLimitError } from "./src/errors/RateLimitError.js";
import { TimeoutError } from "./src/errors/TimeoutError.js";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import express from "express";
import { oauth2TokenQueue } from "./src/queues/OAuth2Token.js";
import "./src/job/oauth2-token-generation-worker.js";
import { scheduleAccessTokenRefresh } from "./src/queues/OAuth2Token.js";


const app = express();

const serverAdapter = new ExpressAdapter();
createBullBoard({
    queues: [new BullMQAdapter(oauth2TokenQueue)],
    serverAdapter,
});
serverAdapter.setBasePath("/admin/queues");
app.use("/admin/queues", serverAdapter.getRouter());


// Load configuration from environment variables
const { baseURL, authType, credentials, oath2Config, redisConfig, accessTokenURL } = getConfig();

// Create an authentication handler
const authHandler = CreateAuthHandler(authType, credentials, oath2Config, accessTokenURL, redisConfig);

if (authType === 'oauth2') {
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
