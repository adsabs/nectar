import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';

import { sessionResponseSchema } from '../types';

export const sessionRoute: FastifyPluginCallbackTypebox = (server) => {
  server.route({
    schema: {
      response: {
        200: sessionResponseSchema,
      },
    },
    url: '/api/user',
    method: ['GET'],
    onRequest: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      await reply.send({
        user: request.user,
      });
    },
  });
  return server;
};
