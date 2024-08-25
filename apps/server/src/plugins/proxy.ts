import FastifyProxy from '@fastify/http-proxy';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const proxy: FastifyPluginAsync = async (server) => {
  await server.register(FastifyProxy, {
    config: {
      rateLimit: {
        max: 100,
        timeWindow: '1 minute',
        errorResponseBuilder: (_req, context) => ({
          code: 429,
          error: 'Too Many Requests',
          message: `You have exceeded the api request limit. Please try again in ${context.after}`,
        }),
      },
    },
    upstream: 'https://qa.adsabs.harvard.edu',
    prefix: '/v1',
    rewritePrefix: '/v1',
    http2: false,
    logLevel: 'trace',
    undici: {
      connections: 16,
      pipelining: 8,
      keepAliveTimeout: 60_000,
      connectTimeout: 30_000,
    },
    preValidation: server.auth([server.authenticate]),
    proxyPayloads: false,
    preHandler: (request, reply, next) => {
      request.headers['authorization'] = `Bearer ${request.auth.user.token}`;
      next();
    },
  });
};

export default fp(proxy, {
  name: 'proxy',
  dependencies: ['cache'],
});
