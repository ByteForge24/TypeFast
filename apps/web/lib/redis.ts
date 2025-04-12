import Redis from "ioredis";

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const URL = process.env.REDIS_URL || "redis://localhost:6379";
    redisInstance = new Redis(URL, {
      lazyConnect: true,
      retryStrategy: () => null, // Don't reconnect on errors
    });
    
    // Suppress unhandled error events during build
    redisInstance.on("error", (err) => {
      if (process.env.NODE_ENV === "production") {
        console.error("Redis connection error:", err.message);
      }
    });
  }
  return redisInstance;
}

export default getRedis();
