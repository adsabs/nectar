import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import fp from 'fastify-plugin';

import { IADSApiUserDataResponse } from '../../../client/src/api';
import { TRACING_HEADERS } from '../config';
import { pick, unwrapHeader } from '../lib/utils';
import { FetcherError } from '../plugins/fetcher';
import { APILoginResponse, loginErrorResponseSchema, loginPayloadSchema, loginResponseSchema } from '../types';

export const loginRoute: FastifyPluginCallbackTypebox = (server) => {
  server.post('/auth/login', {
    schema: {
      body: loginPayloadSchema,
      response: {
        '200': loginResponseSchema,
        '401': loginErrorResponseSchema,
        '5xx': loginErrorResponseSchema,
      },
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: (_req, context) => ({
          code: 429,
          error: 'Too Many Requests',
          message: `You have exceeded the login request limit. Please try again in ${context.after}`,
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        server.log.info({ msg: 'login request', body: request.body });
        const { credentials, csrf } = request.body;

        // Validate CSRF token
        if (!csrf || typeof csrf !== 'string' || csrf.trim() === '') {
          return reply.status(401).send({
            errorKey: 'csrf-invalid',
            friendlyMessage: 'The form was not submitted correctly, please try again',
          });
        }

        // Send login request to the API
        const {
          body: loginBody,
          statusCode: loginStatusCode,
          headers: loginResponseHeaders,
        } = await server.fetcher<APILoginResponse>({
          method: 'POST',
          path: 'LOGIN',
          payload: credentials,
          headers: {
            ...request.headers,
            [server.config.CSRF_HEADER]: csrf,
          },
        });

        server.log.info({
          msg: 'login response',
          body: JSON.stringify(loginBody),
          message: loginBody.message,
        });

        // Check if authentication was successful
        if (loginStatusCode === 200 && loginBody?.message === 'success') {
          request.session.delete(); // Destroy the current session
          const setCookie = unwrapHeader(loginResponseHeaders);

          // Bootstrap a new token
          const {
            body: bootstrapBody,
            headers: bootstrapResponseHeaders,
            statusCode: bootstrapStatusCode,
          } = await server.bootstrapToken(request, setCookie);

          if (bootstrapStatusCode !== 200) {
            return reply.status(500).send({
              errorKey: 'login-error',
              friendlyMessage: 'There was a problem retrieving the user API access',
              actualError: bootstrapBody.error,
            });
          }

          // Retrieve user settings
          const { body: settings, statusCode: settingsStatusCode } = await server.fetcher<IADSApiUserDataResponse>({
            path: 'USER_DATA',
            method: 'GET',
            headers: {
              ...pick(TRACING_HEADERS, bootstrapResponseHeaders),
              Authorization: `Bearer ${bootstrapBody.access_token}`,
            },
          });

          if (settingsStatusCode !== 200) {
            return reply.status(500).send({
              errorKey: 'login-error',
              friendlyMessage: 'There was a problem retrieving the user information from the database',
            });
          }

          // Return a success response
          return reply.status(200).send({
            api: {
              token: bootstrapBody.access_token,
            },
            user: {
              name: bootstrapBody.username,
              settings,
              isAnonymous: bootstrapBody.anonymous,
            },
          });
        } else if (loginStatusCode === 401) {
          // Handle authentication failure
          server.log.error({
            msg: 'login error',
            err: loginBody.error,
            statusCode: loginStatusCode,
          });
          return reply.status(401).send({
            errorKey: 'login-error',
            friendlyMessage: loginBody.message || 'Invalid credentials. Please try again.',
            actualError: loginBody.error,
          });
        }

        // Handle authentication failure
        server.log.error({
          msg: 'login error',
          err: loginBody.error,
          statusCode: loginStatusCode,
        });
        return reply.status(401).send({
          errorKey: 'login-error',
          friendlyMessage: 'Invalid credentials. Please try again.',
          actualError: loginBody.error,
        });
      } catch (error) {
        // Catch and log unexpected errors
        server.log.error({
          msg: 'Unexpected error during login',
          err: error as FetcherError,
        });
        return reply.status(500).send({
          errorKey: 'login-error',
          friendlyMessage: 'An unexpected error occurred. Please try again later.',
          actualError: error.message,
        });
      }
    },
  });

  return server;
};
