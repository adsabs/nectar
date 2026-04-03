import Redis, { RedisOptions } from 'ioredis';
import { logger } from '@/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

const redisLogger = logger.child({ msgPrefix: '[redis] ' });

const buildRedisOptions = (): RedisOptions => {
  const portEnv = process.env.REDIS_PORT || '6379';
  const parsedPort = Number(portEnv);
  const port = Number.isNaN(parsedPort) ? 6379 : parsedPort;

  return {
    host: process.env.REDIS_HOST,
    port,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 1,
    commandTimeout: 100,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy: (times) => {
      if (times >= 3) {
        return null;
      }

      return Math.min(times * 200, 2000);
    },
  };
};

export const getRedisClient = (): Redis | null => {
  if (redisClient) {
    return redisClient;
  }

  if (!process.env.REDIS_HOST) {
    redisAvailable = false;
    redisLogger.warn('REDIS_HOST is not set; Redis client disabled');
    return null;
  }

  redisClient = new Redis(buildRedisOptions());

  redisClient.on('ready', () => {
    redisAvailable = true;
    redisLogger.info('Redis connection ready');
  });

  redisClient.on('error', (err) => {
    redisAvailable = false;
    const message = err instanceof Error ? err.message : String(err);
    redisLogger.warn(message);
  });

  redisClient.on('close', () => {
    redisAvailable = false;
    redisLogger.info('Redis connection closed');
  });

  return redisClient;
};

export const isRedisAvailable = (): boolean => redisAvailable;
