import FastifyRateLimit from '@fastify/rate-limit';
import FastifyRedis from '@fastify/redis';
import { createHash } from 'crypto';
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { Readable } from 'stream';

import { consumeReadableStream } from '../lib/utils';

/**
 * Builds a cache key based on the request URL.
 *
 * @param {FastifyRequest} request - The Fastify request object.
 * @returns {string} - The generated cache key.
 */
export const buildCacheKey = (request: FastifyRequest): string => {
  const { url } = request.raw;
  const encryptedData = createHash('md5').update(url);
  return encryptedData.digest('hex');
};

/**
 * Fastify plugin for caching responses and rate limiting requests.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
const cache: FastifyPluginAsync = async (server) => {
  await server.register(FastifyRedis, {
    logLevel: 'info',
    enableReadyCheck: true,
    keyPrefix: server.config.REDIS_KEY_PREFIX,
    url: server.config.REDIS_URL,
  });

  // Register the rate-limit plugin
  await server.register(FastifyRateLimit, {
    // allowList: ['127.0.0.1', 'localhost'],
    max: 50,
    timeWindow: 10000,
    redis: server.redis,
  });

  server.setErrorHandler(async (error, request, reply) => {
    if (error.statusCode === 429) {
      await reply.redirect(429, '/error?code=429');
    }
  });

  /**
   * Hook to handle requests before processing.
   * Checks the cache for GET requests to /v1/ and serves the cached response if available.
   *
   * @param {FastifyRequest} request - The Fastify request object.
   * @param {FastifyReply} reply - The Fastify reply object.
   */
  server.addHook('onRequest', async (request, reply) => {
    // Skip non-GET requests or URLs that don't start with /v1/
    if (request.raw.method !== 'GET' || !request.raw.url.startsWith('/v1/')) {
      return;
    }

    // Generate a cache key based on the request URL
    const cacheKey = buildCacheKey(request);

    try {
      // Check if the request is in the cache
      const cachedResponse = await server.redis.get(cacheKey);
      if (cachedResponse) {
        server.log.debug({
          msg: 'Cache hit for key',
          cacheKey,
          cachedResponse: JSON.parse(cachedResponse),
        });

        // Serve the cached response
        await reply.send(JSON.parse(cachedResponse));

        // Return to avoid further processing
        return reply;
      }
    } catch (err) {
      server.log.error({ msg: 'Cache get failed', err });
    }

    server.decorate('checkCache', async <Res>(request) => {
      const cacheKey = buildCacheKey(request);
      server.log.debug({ msg: 'Checking cache for key', cacheKey });
      const [err, response] = await server.to(server.redis.get(cacheKey));
      if (err) {
        server.log.error({ msg: 'Cache get failed', err });
        return null;
      }

      server.log.debug({
        msg: 'Cache hit for key',
        cacheKey,
      });
      return JSON.parse(response) as Res;
    });

    server.decorate('setCache', async (request, response) => {
      const cacheKey = buildCacheKey(request);
      const [err] = await server.to(server.redis.set(cacheKey, JSON.stringify(response), 'EX', 300));
      if (err) {
        server.log.error({ msg: 'Cache set failed', err });
      }
    });

    return;
  });

  /**
   * Hook to handle responses before they are sent.
   * Caches the response body for GET requests to /v1/.
   *
   * @param {FastifyRequest} request - The Fastify request object.
   * @param {FastifyReply} reply - The Fastify reply object.
   * @param {Readable} payload - The response payload as a readable stream.
   * @returns {Promise<string>} - The modified payload to be sent.
   */
  server.addHook('onSend', async (request, reply, payload: Readable) => {
    // Skip non-GET requests, URLs that don't start with /v1/, or non-readable payloads
    if (
      request.raw.method !== 'GET' ||
      !request.raw.url.startsWith('/v1/') ||
      !payload?.readable ||
      reply.statusCode !== 200
    ) {
      return payload;
    }

    // Consume the readable stream and get the response body as a string
    const body = await consumeReadableStream(payload);

    // Generate a cache key based on the request URL
    const cacheKey = buildCacheKey(request);

    try {
      // Store the response in the cache (TTL 5 mins)
      await server.redis.set(cacheKey, body, 'EX', 300);

      server.log.debug({ msg: 'Cache set for key', cacheKey, body });
    } catch (err) {
      server.log.error({ msg: 'Cache set failed', err });
    }

    // Return the response body to be sent
    return body;
  });
};

export default fp(cache, {
  name: 'cache',
});
