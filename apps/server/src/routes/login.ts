import { FastifyPluginCallbackTypebox, Static, Type as T } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';

const loginPayload = T.Object({
  credentials: T.Object({
    username: T.String(),
    password: T.String(),
  }),
  csrf: T.String(),
});

const loginResponse = T.Object({
  api: T.Object({
    token: T.String(),
  }),
  user: T.Object({
    name: T.String(),
    settings: T.Unknown(),
    isAnonymous: T.Boolean(),
  }),
});

const loginErrorResponse = T.Object({
  apiError: T.String(),
  friendlyMessage: T.Optional(T.String()),
});

const CSRFResponse = T.Object({
  csrf: T.String(),
});

const apiLoginResponse = T.Object({
  message: T.Optional(T.String()),
  error: T.Optional(T.String()),
});

export type NectarLoginResponse = Static<typeof loginResponse> & Static<typeof loginErrorResponse>;

const loginRoute: FastifyPluginCallbackTypebox = (server) => {
  server.route({
    schema: {
      body: loginPayload,
      response: {
        '200': loginResponse,
        '401': loginErrorResponse,
        '5xx': loginErrorResponse,
      },
    },
    url: '/auth/login',
    method: ['POST'],
    handler: async (request, reply) => {
      const { credentials, csrf } = request.body;

      server.log.debug({ msg: 'login request', credentials, csrf });

      const { body, statusCode } = await server.fetcher<Static<typeof apiLoginResponse>>({
        method: 'POST',
        path: 'USER',
        body: JSON.stringify(credentials),
        headers: {
          [server.config.CSRF_HEADER]: csrf,
          // use the session cookie (if present)
          cookie: request.cookies[server.config.ADS_SESSION_COOKIE_NAME],
        },
      });
      server.log.info({ msg: 'login response', body: JSON.stringify(body), message: body.message });

      if (statusCode === 200 && body?.message === 'success') {
        // destroy the current session
        request.session.delete();

        // force a redirect to index
        await reply.redirect('/');
      }

      server.log.error({ msg: 'login error', error: body.error, statusCode });
      return reply.status(statusCode).send({ apiError: body.error, friendlyMessage: 'Unable to login user' });
    },
  });

  return server;
};

export default fp(loginRoute, {
  name: 'routes/login',
  dependencies: ['session', 'cache'],
});
