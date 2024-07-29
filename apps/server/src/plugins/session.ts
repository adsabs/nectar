import FastifySecureSession from '@fastify/secure-session';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { parse } from 'url';

import { IBootstrapPayload } from '../../../client/src/api';
import { getSetCookieHeader } from '../lib/utils';

const TRACING_HEADERS = ['X-Original-Uri', 'X-Original-Forwarded-For', 'X-Forwarded-For', 'X-Amzn-Trace-Id'];

const sessionRoutes = [
  '/abs/',
  '/search',
  '/user/',
  '/public-libraries/',
  '/settings/',
  '/feedback/',
  '/_app',
  '/classic-form',
  '/paper-form',
  '/session',
];

const session: FastifyPluginAsync = async (server) => {
  /**
   * Check if the request should be handled by this plugin
   * @param request
   */
  const shouldHandle = (request: FastifyRequest) => {
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

    // const { body, headers } = await server.fetcher<BootstrapPayload>({
    //   path: 'BOOTSTRAP',
    //   method: 'GET',
    //   headers: {
    //     // use the session cookie (if present)
    //     cookie: request.session.get('adsws_session_cookie'),
    //
    //     // forward tracing headers
    //     ...pick(TRACING_HEADERS, request.headers),
    //   },
    // });

    const body: IBootstrapPayload = {
      username: 'twhostetler0@gmail.com',
      scopes: ['api', 'user', 'store-query', 'execute-query', 'store-preferences'],
      client_id: 'ffh7fsBd0GG4qx4prTNF8lnWadUjCHRAx4Ps0w6J',
      access_token: 'gQe9AIA8GxT2teeZfrETT71zu3onjpxgRConx2aL',
      client_name: 'BB client',
      token_type: 'Bearer',
      ratelimit: 1.0,
      anonymous: false,
      client_secret: 'bbSAMwmohbbTwO0efATnr17OlanrFhVBGd5I8k5LKWlxjUeaZGq374fNHLH7',
      expire_in: '2500-01-01T00:00:00',
      refresh_token: 'xBrZ1LDUsfVruEoTX7Nz68EXFYvJes1cUpaWLeRi',
    };

    const headers = {};

    server.log.info('Bootstrap successful');
    // Store the incoming set-cookie in our session
    // we need to keep this value, so we can use it to bootstrap later if need be ??
    request.session.set('adsws_session_cookie', getSetCookieHeader(headers));

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

  const isSessionValid = (request: FastifyRequest) => {
    return !!request.session;
  };

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

    // Check if the incoming request has a session cookie
    const hasSessionCookie = request.cookies[server.config.ADS_SESSION_COOKIE_NAME];

    // Then check if the session is valid

    server.log.info('Checking session, bootstrapping if necessary');
    server.log.info({ data: request.session.get('user') });
    try {
      if (isSessionValid(request)) {
        const user = request.session.get('user');
        if (user) {
          server.log.info('session found, continuing');
          server.log.info({ msg: 'session', user, apiCookie: request.session.get('adsws_session_cookie') });
        } else {
          await bootstrapToken(request);
        }
      } else {
        await bootstrapToken(request);
      }
    } catch (e) {
      server.log.error({ error: e as Error });
      throw e;
    }
  });
};

export default fp(session, {
  name: 'session',
  dependencies: ['request', 'cache'],
});
