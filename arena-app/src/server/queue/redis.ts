import { Redis } from "ioredis";
import { env } from "~/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedis(): Redis {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,    // Required by BullMQ
  });
  redis.on("error", (err: Error) => {
    console.error("[Redis] connection error:", err.message);
  });
  return redis;
}

export const redis = globalThis.__redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalThis.__redis = redis;
}
