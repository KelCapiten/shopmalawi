//src/services/cacheService.js
import Redis from "redis";

// Create Redis client
const client = Redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff with max delay of 3s
      const delay = Math.min(retries * 50, 3000);
      return delay;
    },
  },
});

// Handle Redis connection events
client.on("error", (err) => console.error("Redis Client Error:", err));
client.on("connect", () => console.log("Redis Client Connected"));
client.on("reconnecting", () => console.log("Redis Client Reconnecting..."));

// Connect to Redis
await client.connect();

// Cache wrapper with promise interface
export const cache = {
  async get(key) {
    try {
      const value = await client.get(key);
      return value;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await client.set(key, value, { EX: ttl });
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  },

  async del(pattern) {
    try {
      if (pattern.includes("*")) {
        // Delete keys matching pattern
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(keys);
        }
      } else {
        // Delete single key
        await client.del(pattern);
      }
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  },

  async clear() {
    try {
      await client.flushAll();
      return true;
    } catch (error) {
      console.error("Cache clear error:", error);
      return false;
    }
  },
};
