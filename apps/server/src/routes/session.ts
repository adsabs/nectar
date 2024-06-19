import FastifyPassport from '@fastify/passport';
import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';

import { sessionErrorResponseSchema, sessionResponseSchema } from '../types';

const sessionRoute: FastifyPluginCallbackTypebox = (server) => {
  server.route({
    schema: {
      response: {
        200: sessionResponseSchema,
        401: sessionErrorResponseSchema,
        429: sessionErrorResponseSchema,
        '5xx': sessionErrorResponseSchema,
      },
    },
    url: '/api/user',
    method: ['GET'],
    preValidation: FastifyPassport.authenticate(['user'], { session: true }),
    handler: async (request, reply) => {
      if (request.user) {
        await reply.send({ user: request.user });
      } else {
        await reply.code(401).send({
          friendlyMessage: 'Unauthorized',
          actualError: 'User is not authenticated',
        });
      }
    },
  });
  return server;
};

export default fp(sessionRoute, {
  name: 'routes/session',
  dependencies: ['cache'],
});
