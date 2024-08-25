import { Type as T } from '@sinclair/typebox';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { TRACING_HEADERS } from '../config';
import { bootstrapResponseToUser, getAnonymousUser, hasToken, pick, skipUrl } from '../lib/utils';
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
        sameSite: 'strict',
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
        reply.send(err);
      }

      const user = bootstrapResponseToUser(res.body);

      // Generate a new JWT
      const newToken = await reply.jwtSign({
        user,
        id: res.body.username,
        exSession: request.cookies[server.config.ADS_SESSION_COOKIE_NAME],
      });

      void reply.raw.setHeader('set-cookie', [
        server.serializeCookie(server.config.SCIX_SESSION_COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: server.config.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          expires: getTokenExpiry(),
        }),
        res.headers['set-cookie'],
      ]);
      return reply.send({ user });
    },
  });

  const isSSRRoute = (url: string) => {
    return url.startsWith('/search') || url.startsWith('/abs') || url.startsWith('/_next/data');
  };

  const handleSSRRoute = async (request: FastifyRequest, reply: FastifyReply) => {
    server.log.debug('is SSR route, will validate');

    // check if we have an incoming jwt
    const [jwtErr] = await server.to(request.jwtVerify());

    if (jwtErr) {
      if (jwtErr?.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        server.log.error({ err: jwtErr }, 'Invalid JWT token, clear cookie and return now');
        void reply.clearCookie(server.config.SCIX_SESSION_COOKIE_NAME);
        return reply.send(jwtErr);
      }
    }

    if (hasToken(request.auth.user)) {
      server.log.debug('Already have a valid token, skipping refresh');
      return;
    }
    server.log.debug('No valid token, refreshing session');
    const [bootstrapErr, res] = await server.bootstrap(request);
    if (bootstrapErr) {
      server.log.error({ err: bootstrapErr }, 'Error during bootstrap');
      return;
    }

    const user = bootstrapResponseToUser(res.body);

    // Generate a new JWT
    const newToken = await reply.jwtSign({
      user,
      id: res.body.username,
      exSession: request.cookies[server.config.ADS_SESSION_COOKIE_NAME],
    });

    void reply.raw.setHeader('set-cookie', [
      server.serializeCookie(server.config.SCIX_SESSION_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: server.config.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: getTokenExpiry(),
      }),
      res.headers['set-cookie'],
    ]);

    server.log.debug('Refreshed session');
    return;
  };

  server.addHook('onRequest', async (request, reply) => {
    const url = request.url;
    if (skipUrl(url.split('?')[0])) {
      server.log.debug({
        msg: 'Skipping validating session for this route',
        url,
      });
      return;
    }

    if (isSSRRoute(url)) {
      return await handleSSRRoute(request, reply);
    }

    if (!request.cookies[server.config.SCIX_SESSION_COOKIE_NAME]) {
      server.log.debug({ url }, 'No session cookie found, creating anonymous session');
      await server.createAnonymousSession(request, reply);
      return;
    }

    const [err] = await server.to(request.jwtVerify());
    if (err) {
      if (err?.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        server.log.error({ err }, 'Invalid JWT token, clear cookie and return now');
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
