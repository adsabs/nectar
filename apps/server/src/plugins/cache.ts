import FastifyRateLimit from '@fastify/rate-limit';
import FastifyRedis from '@fastify/redis';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

const cache: FastifyPluginAsync = async (fastify) => {
  const redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
  });
  await fastify.register(FastifyRedis, {
    client: redis,
    logLevel: 'debug',
    enableReadyCheck: true,
    keyPrefix: 'nectar:',
  });

  // Register the rate-limit plugin
  await fastify.register(FastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
  });
};

export default fp(cache, {
  name: 'cache',
});
