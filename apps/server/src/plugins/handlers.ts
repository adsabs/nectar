import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const handlers: FastifyPluginCallback = (server) => {
  server.get('/test', (_request, reply) => {
    return reply.send({ status: 'OK' });
  });

  return server;
};

export default fp(handlers, {
  name: 'handlers',
  dependencies: ['session', 'cache'],
});
