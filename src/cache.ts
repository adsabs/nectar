import Redis from 'ioredis';

/**
 * Singleton class to manage the Redis instance.
 */
class Cache {
  private static instance: Redis;
  /**
   * Get the Redis instance or create a new one.
   * @returns Redis instance
   */
  public static getInstance(): Redis {
    if (!Cache.instance) {
      Cache.instance = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        keyPrefix: process.env.REDIS_PREFIX,
      });
    }
    return Cache.instance;
  }
}

export default Cache;
