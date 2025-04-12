import Redis from "ioredis";

let redisInstance: Redis | null = null;
let redisError: Error | null = null;

export function getRedis(): Redis | null {
  if (redisError) return null; // Redis is disabled
  
  if (!redisInstance) {
    const URL = process.env.REDIS_URL;
    
    // Skip Redis if no URL is provided
    if (!URL) {
      redisError = new Error("REDIS_URL not configured");
      console.warn("Redis not configured. Leaderboard features will be disabled.");
      return null;
    }
    
    try {
      redisInstance = new Redis(URL, {
        retryStrategy: () => null, // Don't reconnect on errors
        enableReadyCheck: false,
        enableOfflineQueue: false,
      });
      
      redisInstance.on("error", (err) => {
        console.error("Redis connection error:", err.message);
        redisError = err;
      });
    } catch (err) {
      console.warn("Failed to initialize Redis:", err);
      redisError = err as Error;
      return null;
    }
  }
  
  return redisInstance;
}

export default getRedis();
