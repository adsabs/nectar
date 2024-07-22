import { FastifyPluginCallbackTypebox, Static, Type as T } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';
import { errors } from 'undici';

import { getSetCookieHeader } from '../lib/utils';

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
  error: T.String(),
  friendlyMessage: T.String({ required: false }),
});

const CSRFResponse = T.Object({
  csrf: T.String(),
});

const apiLoginResponse = T.Object({
  message: T.String({ required: false }),
  error: T.String({ required: false }),
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

      try {
        const { body, statusCode } = await server.fetcher<Static<typeof apiLoginResponse>>({
          method: 'POST',
          path: 'USER',
          body: JSON.stringify(credentials),
          headers: {
            [server.config.CSRF_HEADER]: csrf,
            // use the session cookie (if present)
            cookie: request.session.get('adsws_session_cookie'),
          },
        });
        server.log.info({ msg: 'login response', body });

        if (statusCode === 200 && body?.message === 'success') {
          // destroy the current session
          request.session.delete();

          // force a redirect to index
          await reply.redirect('/');
        } else {
          return reply.status(statusCode).send({ error: body.error, friendlyMessage: 'Unable to login user' });
        }
      } catch (error) {
        if (error instanceof errors.UndiciError) {
          server.log.error({ msg: 'login error', error: error });
          return reply.status(500).send({
            friendlyMessage: 'Unable to login user',
            error: error.body?.error as string,
          });
        }
      }

      return reply;
    },
  });

  // proxy the CSRF request to the api
  server.route({
    url: '/auth/csrf',
    method: ['GET'],
    schema: {
      response: {
        200: CSRFResponse,
      },
    },
    handler: async (request, reply) => {
      const { body, headers } = await server.fetcher<Static<typeof CSRFResponse>>({ path: 'CSRF', method: 'GET' });

      // set the incoming set-cookie in our session
      request.session.set('adsws_session_cookie', getSetCookieHeader(headers));
      return reply.send({ csrf: body.csrf });
    },
  });

  return server;
};

export default fp(loginRoute, {
  name: 'routes/login',
  dependencies: ['session', 'cache'],
});
