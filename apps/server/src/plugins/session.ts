import FastifySecureSession from '@fastify/secure-session';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { parse } from 'url';

import { pick } from '../lib/utils.js';
import { IBootstrapPayload } from '../types.js';

const TRACING_HEADERS = ['X-Original-Uri', 'X-Original-Forwarded-For', 'X-Forwarded-For', 'X-Amzn-Trace-Id'];

const sessionRoutes = [
  '/abs/',
  '/search/',
  '/user/',
  '/public-libraries/',
  '/settings/',
  '/feedback/',
  '/_app',
  '/classic-form',
  '/paper-form',
];

const session: FastifyPluginAsync = async (server) => {
  /**
   * Check if the request should be handled by this plugin
   * @param request
   */
  const shouldHandle = (request: FastifyRequest) => {
    return false;
    const { pathname } = parse(request.raw.url ?? '', true);

    if (!pathname) {
      return false;
    }

    // Check if the request is for a session route
    return sessionRoutes.some((route) => pathname.startsWith(route)) || pathname === '/';
  };

  /**
   * Bootstrap the api token
   * @param request
   */
  const bootstrapToken = async (request: FastifyRequest) => {
    server.log.info('Bootstrapping token');

    const { body, headers } = await server.fetcher<IBootstrapPayload>({
      path: 'BOOTSTRAP',
      method: 'GET',
      headers: {
        // use the session cookie (if present)
        cookie: request.session.get('adsws_session_cookie'),

        // forward tracing headers
        ...pick(TRACING_HEADERS, request.headers),
      },
    });

    server.log.info('Bootstrap successful');
    // Store the incoming set-cookie in our session
    // we need to keep this value, so we can use it to bootstrap later if need be ??
    const setCookie = Array.isArray(headers['set-cookie']) ? headers['set-cookie'][0] : headers['set-cookie'];
    request.session.set('adsws_session_cookie', setCookie);

    server.log.info({ msg: 'user', user: body });
    request.session.set('user', body);
  };

  await server.register(FastifySecureSession, {
    cookieName: server.config.SCIX_SESSION_COOKIE_NAME,
    key: Buffer.from(server.config.COOKIE_SECRET, 'hex'),
    expiry: 24 * 60 * 60,
    cookie: {
      path: '/',
      httpOnly: server.config.NODE_ENV === 'production',
      secure: server.config.NODE_ENV === 'production',
      domain: 'localhost',
    },
    logLevel: 'debug',
  });

  /**
   * PreHandler hook to bootstrap the token, if necessary
   */
  server.addHook('preHandler', async (request) => {
    // in the case the request is not handled by this plugin, we can skip the rest of the logic
    // this should happen when the request is for a static file, for example
    if (!shouldHandle(request)) {
      server.log.info('NOT checking session, passing through');
      return;
    }
    server.log.info('Checking session, bootstrapping if necessary');
    try {
      server.log.info({ msg: 'session', session: request.session.get('user') });
      if (request.session) {
        const user = request.session.get('user');
        if (user) {
          server.log.info('session found, continuing');
          server.log.info({ msg: 'user found', user });
        } else {
          await bootstrapToken(request);
        }
      } else {
        await bootstrapToken(request);
      }
    } catch (e) {
      server.log.error({ error: e });
      throw e;
    }
  });

  /**
   * Route to get the session info
   */
  server.get<{
    Querystring: never;
    Headers: never;
    Reply: {
      200: {
        api: {
          token: string;
        };
      };
    };
  }>('/session', async (request, reply) => {
    void reply.status(200).send({
      api: {
        token: request.session.get('user')?.access_token ?? '',
      },
    });

    return reply;
  });
};

export default fp(session, {
  name: 'session',
  dependencies: ['request', 'cache'],
});
