import { Type as T } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { TRACING_HEADERS } from '../config';
import { bootstrapResponseToUser, getAnonymousUser, pick, skipUrl } from '../lib/utils';
import { BootstrapResponse, sessionResponseSchema, userSchema } from '../types';
import { FetcherResponse } from './fetcher';

const getTokenExpiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

const authPlugin: FastifyPluginAsync = async (server) => {
  server.decorate('bootstrap', async (request) => {
    return server.to<FetcherResponse<BootstrapResponse>>(
      server.fetcher<BootstrapResponse>({
        path: 'BOOTSTRAP',
        method: 'GET',
        headers: {
          ...pick(TRACING_HEADERS, request.headers),
          cookie: request.cookies[server.config.ADS_SESSION_COOKIE_NAME],
        },
      }),
    );
  });

  server.decorate('createAnonymousSession', async (request, reply) => {
    const exSession = request.cookies[server.config.ADS_SESSION_COOKIE_NAME];
    request.auth = {
      id: 'anonymous@ads',
      user: getAnonymousUser(),
      exSession,
    };
    const [signError, signedJwt] = await server.to(reply.jwtSign(request.auth));

    if (signError) {
      server.log.error({ signError }, 'Error during jwtSign');
      return reply.send(signError);
    }

    reply.raw.setHeader('set-cookie', [
      server.serializeCookie(server.config.SCIX_SESSION_COOKIE_NAME, signedJwt, {
        httpOnly: true,
        secure: server.config.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: getTokenExpiry(),
      }),
      ...(exSession ? [exSession] : []),
    ]);
  });

  server.decorate('authenticate', async (request) => {
    server.log.debug({
      msg: 'Authenticating user for route',
      url: request.raw.url,
      cookies: request.cookies,
    });
    await request.jwtVerify();
    server.log.debug({ msg: 'Authentication successful' });
  });

  server.route({
    url: '/api/auth/session',
    schema: {
      response: {
        200: sessionResponseSchema,
      },
    },
    method: 'GET',
    onRequest: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      server.log.debug({ user: request.auth.user });
      return reply.send({ user: request.auth.user });
    },
  });

  server.route({
    url: '/api/auth/refresh',
    method: 'GET',
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      response: {
        200: T.Object({ user: userSchema }),
        500: T.String(),
      },
    },
    onRequest: server.auth([server.authenticate]),
    handler: async (request, reply) => {
      const [err, res] = await server.bootstrap(request);

      if (err) {
        server.log.error({ err }, 'Error during bootstrap');
        return reply.send(err);
      }

      // send back down any new set-cookie headers
      if (res.headers['set-cookie']) {
        void reply.header('set-cookie', res.headers['set-cookie']);
      }
      const user = bootstrapResponseToUser(res.body);

      // Generate a new JWT
      const newToken = await reply.jwtSign({
        user,
        id: res.body.username,
        exSession: request.cookies[server.config.ADS_SESSION_COOKIE_NAME],
      });

      // Set the new JWT as a secure cookie
      void reply.setCookie(server.config.SCIX_SESSION_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: server.config.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: getTokenExpiry(), // Set your expiry
      });

      return reply.send({ user });
    },
  });

  server.addHook('onRequest', async (request, reply) => {
    const url = request.url;
    if (skipUrl(url.split('?')[0])) {
      server.log.debug({
        msg: 'Skipping validating session for this route',
        url,
      });
      return;
    }
    if (!request.cookies[server.config.SCIX_SESSION_COOKIE_NAME]) {
      await server.createAnonymousSession(request, reply);
      return;
    }

    const [err] = await server.to(request.jwtVerify());
    if (err) {
      if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        void reply.clearCookie(server.config.SCIX_SESSION_COOKIE_NAME);
        return reply.send(err);
      }

      await server.createAnonymousSession(request, reply);
    }
  });
};

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['fetcher'],
});

const mockBootstrap = async (delay = 0) =>
  new Promise<FetcherResponse<BootstrapResponse>>((res) => {
    setTimeout(
      () =>
        res({
          body: {
            access_token: '78Cun1vgVWkA9bB2DK1kpx6yCsjZ8xnQHP3HKDgo',
            refresh_token: '6gGoZvZLbirsTJDU84HirqIuUvda7FgLbyHTMpst',
            expires_at: '1723927198',
            token_type: 'bearer',
            username: 'anonymous@ads',
            scopes: ['api', 'execute-query', 'store-query'],
            anonymous: true,
            client_id: 'YqEOUGTYJMhnjCFF0vPQ1N5JhUNrxdu7wrpAE4Xg',
            client_secret: 'BACUMrpfSUEW7K12rGuAe3RvKE9cTl9s1TwZgPtwNm7ZmtkhsH6k7bbNaJg7',
            ratelimit: 1,
            client_name: 'BB client',
            individual_ratelimits: null,
            given_name: null,
            family_name: null,
          },
          headers: {
            date: 'Fri, 16 Aug 2024 20:39:58 GMT',
            'content-type': 'application/json',
            'content-length': '529',
            connection: 'keep-alive',
            'permissions-policy': 'browsing-topics=()',
            'x-frame-options': 'SAMEORIGIN',
            'x-content-type-options': 'nosniff',
            'content-security-policy': "default-src 'self'; object-src 'none'",
            'strict-transport-security': 'max-age=31556926; includeSubDomains',
            'referrer-policy': 'strict-origin-when-cross-origin',
            'access-control-allow-origin': 'http://0.0.0.0:8000',
            'access-control-allow-credentials': 'true',
            vary: 'Origin, Cookie',
            'set-cookie':
              'session=.eJw9zkFLAzEQhuH_krOHJDuTSXoTaYWCVcGCPZVMZtKt6FrTXRXE_-6i4PWD7-X5Mvva9NybxdgmvTD7o5iF4eRq7RhRgobkbQdSuSP0ITJpyq4yBpEcPEjyscOqNA_EnpkiqCRijTZxZnTJFtehRVJPhS14FwGhWtHoPNNcD4DqVDWAKxALJDNDTtpe8qDD-E-bztr-fJJjEW8LFs7gU-KYqyQnHZBGqnb-v-Zp7Pfl-fhbMLu35e32-mG3vumHp6vVyr7f3bsNrvvtpn3KRB_tdLmEx4P5_gG-8VHO.Zr-5Hg.hLsV4d_j6la6J_CIQg_UC97HHVU; Expires=Sun, 17 Aug 2025 02:39:58 GMT; Secure; HttpOnly; Path=/; SameSite=Lax',
          },
          statusCode: 200,
        }),
      delay,
    );
  });
// if (authCookie) {
//   server.log.debug({ msg: 'Checking existing session', authCookie });
//
//   server.log.debug({ user });
//
//   if (user) {
//     // because of the manual decoding here, it's the whole bootstrap response
//     request.user = bootstrapResponseToUser(user as BootstrapResponse);
//     server.log.debug({ msg: 'User already authenticated', user });
//     return;
//   }
// }
//
//   server.log.debug({ msg: 'Authenticating user for route', url });
//
//   const sessionCookie = request.cookies[server.config.ADS_SESSION_COOKIE_NAME];
//
//   if (!sessionCookie) {
//     server.log.debug('No external session cookie found, bootstrapping will generate a new one');
//   } else {
//     server.log.debug('External session cookie found');
//   }
//
//   // Use a centralized bootstrap process
//   if (bootstrapPromise === null) {
//     bootstrapPromise = (async () => {
//       try {
//         // Replace the mockBootstrap with your actual server.fetcher call
//         const [err, response] = await server.to<FetcherResponse<BootstrapResponse>>(
//           server.fetcher<BootstrapResponse>({
//             path: 'BOOTSTRAP',
//             method: 'GET',
//             headers: {
//               ...pick(TRACING_HEADERS, request.headers),
//               cookie: request.cookies[server.config.ADS_SESSION_COOKIE_NAME],
//             },
//           }),
//         );
//
//         if (err) {
//           server.log.error({ msg: 'Error during bootstrap', err });
//           throw err;
//         }
//
//         server.log.debug({
//           msg: 'Bootstrap successful',
//           body: response.body,
//           statusCode: response.statusCode,
//           headers: response.headers,
//         });
//
//         return response;
//       } finally {
//         // Reset the bootstrapPromise after it completes
//         bootstrapPromise = null;
//       }
//     })();
//   }
//
//   try {
//     const response = await bootstrapPromise;
//
//     // apply the response to the user param for use in downstream handlers
//     request.user = bootstrapResponseToUser(response.body);
//
//     // Process the bootstrap response
//     request.externalSessionCookie = unwrapHeader(response.headers['set-cookie']);
//
//     const jwt = await reply.jwtSign(response.body);
//     request.authCookie = server.serializeCookie(server.config.SCIX_SESSION_COOKIE_NAME, jwt, {
//       httpOnly: true,
//       secure: server.config.NODE_ENV === 'production',
//       sameSite: 'lax',
//       path: '/',
//       expires: EXPIRES,
//     });
//
//     reply.raw.setHeader('set-cookie', [request.externalSessionCookie, request.authCookie]);
//   } catch (error) {
//     server.log.error({ msg: 'Error during bootstrap handling', error });
//     return await reply.send(error);
//   }
