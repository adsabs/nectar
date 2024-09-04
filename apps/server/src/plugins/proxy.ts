import FastifyProxy from '@fastify/http-proxy';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { v4 } from 'uuid';

import { TRACING_HEADERS } from '../config';

const proxy: FastifyPluginAsync = async (server) => {
  server.log.debug({ config: server.config }, 'config');
  await server.register(FastifyProxy, {
    config: {
      rateLimit: {
        max: 120,
        timeWindow: '1 minute',
        errorResponseBuilder: (_req, context) => ({
          code: 429,
          error: 'Too Many Requests',
          message: `You have exceeded the api request limit. Please try again in ${context.after}`,
        }),
      },
    },
    upstream: server.config.API_HOST_SERVER,
    prefix: '/v1',
    rewritePrefix: '/v1',
    http2: false,
    logLevel: 'trace',
    undici: {
      connections: 16,
      pipelining: 1,
      keepAliveTimeout: 60_000,
      connectTimeout: 60_000,
    },
    preValidation: server.auth([server.authenticate]),
    proxyPayloads: false,
    preHandler: (request, reply, next) => {
      server.log.debug({ url: request.url }, 'PROXY');
      request.headers['authorization'] = `Bearer ${request.auth.user.token}`;
      TRACING_HEADERS.forEach((header) => {
        const value = request.headers[header];
        if (value) {
          void reply.header(header, value);
        }
      });
      next();
    },
    replyOptions: {
      rewriteRequestHeaders: (_request, headers) => ({
        ...headers,
        'request-id': v4(),
      }),
    },
  });
};

export default fp(proxy, {
  name: 'proxy',
  dependencies: ['cache'],
});
