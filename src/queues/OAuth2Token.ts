import { Queue } from "bullmq";
import { getConfig } from "../config/env.js";
import IORedis, { Redis } from "ioredis";

const { redisConfig, oath2Config, accessTokenURL } = getConfig();

export const connection = {
    port: redisConfig?.port || 6379,
    host: redisConfig?.host || 'localhost',
}

export const ioRedisClient: IORedis.Redis = new Redis(redisConfig || {});

export const oauth2TokenQueue = new Queue('oauth2-access-token-queue', { connection });

export const scheduleAccessTokenRefresh = async () => {
    const storedTime = await ioRedisClient.get('next-job-time-for-oauth2-access-token');
    const refreshInterval = parseInt(String(JSON.parse(storedTime || '1')), 10) * 1000;
    await oauth2TokenQueue.upsertJobScheduler(
        'schedule-oauth2-access-token-generation',
        { every: refreshInterval },
        {
            name: 'oauth2-access-token-generation',
            data: { config: oath2Config, accessTokenURL, redis: redisConfig },
            opts: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 10,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                }
            }
        }
    );


    console.log(`[Queue] Scheduled access token refresh every ${refreshInterval / 1000}s`);
};
