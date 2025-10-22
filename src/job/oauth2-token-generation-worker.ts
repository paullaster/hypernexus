import { Worker } from "bullmq";
import { connection, ioRedisClient } from "../queues/OAuth2Token.js";
import { OAuth2Handler } from "../auth/handlers/OAuth2AuthHandler.js";

const oauth2AccessTokenWorker = new Worker('oauth2-access-token-queue',
    async (job) => {
        console.log(`[Worker] Processing job ${job.id}`);
        const { config, accessTokenURL, redis } = job.data;
        const oauth2Client = new OAuth2Handler(config, accessTokenURL, redis);
        try {
            const data = await oauth2Client.getAccessToken();
            console.log(data);
            if (data?.access_token && data?.expires_in) {
                const expirationTime = data.expires_in - 10;
                await ioRedisClient.set(
                    'next-job-time-for-oauth2-access-token',
                    JSON.stringify(expirationTime),
                    'EX',
                    expirationTime
                );
                console.log(`[Worker] New token generated. Expires in ${expirationTime}s.`);
            } else {
                console.warn(`[Worker] Invalid token response: ${JSON.stringify(data)}`);
            }
        } catch (error) {
            console.error(`[Worker] Error refreshing token:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 2,
        limiter: {
            max: 1,
            duration: 1000,
        }
    }
);

oauth2AccessTokenWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
});

oauth2AccessTokenWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

export default oauth2AccessTokenWorker;