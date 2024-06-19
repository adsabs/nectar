import FastifyProxy from '@fastify/http-proxy';
import { FastifyPluginAsync } from 'fastify';
import { FastifyRequest } from 'fastify/types/request';
import fp from 'fastify-plugin';

const proxy: FastifyPluginAsync = async (server) => {
  await server.register(FastifyProxy, {
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
      if (request.user) {
        request.headers['authorization'] = `Bearer ${request.user.token}`;
      }
      next();
    },
  });
};

export default fp(proxy, {
  name: 'proxy',
  dependencies: ['cache'],
});
