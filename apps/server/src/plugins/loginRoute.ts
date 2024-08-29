import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';
import { errors } from 'undici';

import { TRACING_HEADERS } from '../config';
import { pick } from '../lib/utils';
import { loginPayloadSchema, loginResponseSchema } from '../types';

const loginRoute: FastifyPluginCallbackTypebox = async (server) => {
  server.route({
    schema: {
      body: loginPayloadSchema,
      response: {
        200: loginResponseSchema,
      },
    },
    method: 'POST',
    url: '/api/auth/login',
    preValidation: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const { credentials, csrf } = request.body;
      server.log.debug('Attempting to login user');
      const [err, loginResponse] = await server.to(
        server.fetcher({
          method: 'POST',
          path: 'LOGIN',
          body: credentials,
          headers: {
            ...pick(TRACING_HEADERS, request.headers),
            cookie: `${server.config.ADS_SESSION_COOKIE_NAME}=${
              request.cookies[server.config.ADS_SESSION_COOKIE_NAME]
            }`,
            [server.config.CSRF_HEADER]: csrf,
          },
        }),
      );

      const loginErr = err as errors.UndiciError;

      if (loginErr) {
        server.log.error({ loginErr }, 'Error during login');
        return reply.status(401).send({
          errorKey: 'login-error',
          friendlyMessage: 'Sorry, login was unsuccessful',
          errorMsg: loginErr.message,
          statusCode: 401,
        });
      }

      server.log.debug({ credentials }, 'login');

      // Your login logic goes here
      return Promise.resolve({
        user: {},
      });
    },
  });
};

export default fp(loginRoute, {
  name: 'loginRoute',
  dependencies: ['auth', 'fetcher'], // Add dependencies as needed
});
