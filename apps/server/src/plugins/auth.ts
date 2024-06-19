import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { TRACING_HEADERS } from 'src/config';

import {
  bootstrapResponseToUser,
  pick,
  skipUrl,
  unwrapHeader,
} from '../lib/utils';
import { BootstrapResponse } from '../types';
import { FetcherResponse } from './fetcher';

const EXPIRES = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

const authPlugin: FastifyPluginAsync = async (server) => {
  server.decorate('authenticate', async (request) => {
    server.log.debug({
      msg: 'Authenticating user for route',
      url: request.raw.url,
      cookies: request.cookies,
    });
    await request.jwtVerify({ onlyCookie: true });
    server.log.debug({ msg: 'Authentication successful' });
  });

  server.addHook('onRequest', async (request, reply) => {
    const url = request.url;
    if (skipUrl(url)) {
      server.log.debug({
        msg: 'Skipping validating session for this route',
        url,
      });
      return;
    }

    const authCookie = request.cookies[server.config.SCIX_SESSION_COOKIE_NAME];
    if (authCookie) {
      server.log.debug({ msg: 'checking', authCookie });
      const user = server.jwt.decode(authCookie);

      server.log.debug({ user });

      if (user) {
        request.user = user;
        server.log.debug({ msg: 'User already authenticated', user });
        return;
      }
    }

    server.log.debug({ msg: 'Authenticating user for route', url });

    // Get hold of the session cookie from the request.
    const sessionCookie =
      request.cookies[server.config.ADS_SESSION_COOKIE_NAME];

    if (!sessionCookie) {
      server.log.debug(
        'No external session cookie found, bootstrapping will generate a new one',
      );
    } else {
      server.log.debug('External session cookie found');
    }

    // bootstrap the session
    const [err, response] = await server.to<FetcherResponse<BootstrapResponse>>(
      server.fetcher<BootstrapResponse>({
        path: 'BOOTSTRAP',
        method: 'GET',
        headers: {
          ...pick(TRACING_HEADERS, request.headers),
          ...(sessionCookie && {
            cookie: `${server.config.ADS_SESSION_COOKIE_NAME}=${sessionCookie}`,
          }),
        },
      }),
    );
    // server.log.debug('returning mocked bootstrap response');
    // const [err, response] = await server.to<FetcherResponse<BootstrapResponse>>(mockBootstrap());
    if (err) {
      server.log.error({ msg: 'Error during bootstrap', err });
      throw new Error('Error during bootstrap');
    }

    const { body, statusCode, headers } = response;
    server.log.debug({
      msg: 'Bootstrap successful',
      body,
      statusCode,
      headers,
    });

    request.externalSessionCookie = unwrapHeader(headers['set-cookie']);

    const jwt = await reply.jwtSign(body);
    request.authCookie = server.serializeCookie(
      server.config.SCIX_SESSION_COOKIE_NAME,
      jwt,
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        expires: EXPIRES,
      },
    );

    reply.raw.setHeader('set-cookie', [
      request.externalSessionCookie,
      request.authCookie,
    ]);

    // apply the response to the user param for use in downstream handlers
    request.user = bootstrapResponseToUser(body);
  });
};

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['fetcher'],
});

const mockBootstrap = async () =>
  Promise.resolve<FetcherResponse<BootstrapResponse>>({
    body: {
      access_token: '78Cun1vgVWkA9bB2DK1kpx6yCsjZ8xnQHP3HKDgo',
      refresh_token: '6gGoZvZLbirsTJDU84HirqIuUvda7FgLbyHTMpst',
      expires_at: '1723927198',
      token_type: 'bearer',
      username: 'anonymous@ads',
      scopes: ['api', 'execute-query', 'store-query'],
      anonymous: true,
      client_id: 'YqEOUGTYJMhnjCFF0vPQ1N5JhUNrxdu7wrpAE4Xg',
      client_secret:
        'BACUMrpfSUEW7K12rGuAe3RvKE9cTl9s1TwZgPtwNm7ZmtkhsH6k7bbNaJg7',
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
  });
