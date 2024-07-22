import { FastifyPluginCallbackTypebox, Static, Type as T } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';

const sessionResponse = T.Object({
  api: T.Object({
    token: T.String(),
  }),
  user: T.Object({
    name: T.String(),
    settings: T.Unknown(),
    isAnonymous: T.Boolean(),
  }),
});

const sessionErrorResponse = T.Object({
  error: T.String(),
});

export type NectarSessionResponse = Static<typeof sessionResponse> & Static<typeof sessionErrorResponse>;

const sessionRoute: FastifyPluginCallbackTypebox = (server) => {
  server.route({
    schema: {
      response: {
        200: sessionResponse,
        401: sessionErrorResponse,
      },
    },
    url: '/session',
    method: ['GET'],
    handler: async (request, reply) => {
      const user = request.session.get('user');

      await reply.status(200).send({
        api: {
          token: user.access_token,
        },
        user: {
          name: user.username,
          settings: {},
          isAnonymous: user.anonymous,
        },
      });

      return reply;
    },
  });
  return server;
};

export default fp(sessionRoute, {
  name: 'routes/session',
  dependencies: ['session', 'cache'],
});
