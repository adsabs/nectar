import fs from 'node:fs';

import FastifyAuth from '@fastify/auth';
import FastifyCookie from '@fastify/cookie';
import FastifyCors from '@fastify/cors';
import FastifyEnv from '@fastify/env';
import FastifyHelmet from '@fastify/helmet';
import FastifyJwt from '@fastify/jwt';
import FastifySensible from '@fastify/sensible';
import FastifyStatic from '@fastify/static';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import * as Sentry from '@sentry/node';
import Fastify, { FastifyServerOptions } from 'fastify';
import next from 'next';
import path from 'path';
import { Dispatcher } from 'undici';

import { IADSApiSearchParams } from '../../client/src/api';
import { loadConfig, TRACING_HEADERS } from './config';
import { bootstrapResponseToUser, noop, pick } from './lib/utils';
import AuthPlugin from './plugins/auth';
import CachePlugin, { buildCacheKey } from './plugins/cache';
import FetcherPlugin, { FetcherError, FetcherResponse, RequestOptions } from './plugins/fetcher';
import ProxyPlugin from './plugins/proxy';
import { sessionResponseSchema } from './types';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

export const buildServer = async (options: FastifyServerOptions = {}) => {
  const { schema, helmetConfig } = loadConfig();
  const server = Fastify(options).withTypeProvider<TypeBoxTypeProvider>();

  const nextDir = isProduction ? __dirname : path.resolve(__dirname, '../../apps/client');
  const nextConfig = isProduction
    ? JSON.parse(
        fs.readFileSync(path.join(__dirname, 'required-server-files.json'), {
          encoding: 'utf-8',
        }),
      )
    : undefined;

  const nextApp = isTest
    ? {
        prepare: noop,
        getRequestHandler: () => () => new Promise((res) => res(null)),
      }
    : next({
        dev: !isProduction,
        conf: nextConfig,
        customServer: true,
        httpServer: server.server,
        port: parseInt(process.env.PORT, 10),
        hostname: '0.0.0.0',
        dir: nextDir,
        quiet: !isProduction,
      });
  const nextjsRouteHandler = nextApp.getRequestHandler();

  try {
    await nextApp.prepare();

    // Register external plugins
    await server.register(FastifyEnv, { schema, dotenv: false });
    await server.register(FastifySensible);
    await server.register(FastifyHelmet, helmetConfig);
    // await server.register(FastifySecureSession, {
    //   cookieName: server.config.SCIX_SESSION_COOKIE_NAME,
    //   key: Buffer.from(server.config.COOKIE_SECRET, 'hex'),
    //   expiry: 24 * 60 * 60,
    //   cookie: {
    //     path: '/',
    //     secure: isProduction,
    //     httpOnly: true,
    //     sameSite: isProduction ? 'lax' : false,
    //   },
    // });
    await server.register(FastifyCookie, {
      secret: server.config.COOKIE_SECRET,
      hook: 'onRequest',
      parseOptions: {
        secure: isProduction,
        signed: false,
      },
    });
    await server.register(FastifyJwt, {
      secret: server.config.COOKIE_SECRET,
      cookie: {
        cookieName: server.config.SCIX_SESSION_COOKIE_NAME,
        signed: false,
      },
      formatUser: bootstrapResponseToUser,
      decoratorName: 'user',
      sign: {
        expiresIn: '24h',
      },
    });
    await server.register(FastifyAuth);
    await server.register(FastifyCors, {
      origin: 'http://locahost:8000',
      credentials: true,
    });

    // Register internal plugins
    await server.register(CachePlugin);
    await server.register(FetcherPlugin);
    await server.register(AuthPlugin);
    await server.register(ProxyPlugin);
    // await server.register(ApiPlugin);
    // await server.register(RoutesPlugin);

    if (isProduction) {
      await server.register(FastifyStatic, {
        root: [path.join(nextDir, '.next/static')],
        prefix: '/_next/static/',
        logLevel: 'debug',
        setHeaders: (res) => {
          void res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
      });
    }
    Sentry.setupFastifyErrorHandler(server);

    // server.addHook('onResponse', async (request, reply) => {
    //   server.log.debug({
    //     msg: 'Responded',
    //     url: request.url,
    //     statusCode: reply.statusCode,
    //     headers: reply.getHeaders(),
    //     session: request.session.get('externalSession'),
    //     user: request.user,
    //   });
    // });

    // server.addHook('onSend', async (request, reply) => {
    //   server.log.debug({ msg: 'Sending response...', url: request.url, user: request.user });
    //
    //   // re-apply tracing headers, if present to the reply
    //   TRACING_HEADERS.forEach((header) => {
    //     if (request.headers[header]) {
    //       reply.header(header, request.headers[header]);
    //     }
    //   });
    //
    //   const externalSession = request.session.get('externalSession');
    //   if (externalSession) {
    //     // if we've set an external session cookie, set it in the response, so it can be used by the client as well
    //     reply.header('set-cookie', externalSession);
    //   }
    // });

    server.after(() => {
      server.route({
        schema: {
          response: {
            200: sessionResponseSchema,
          },
        },
        url: '/api/user',
        method: ['GET'],
        onRequest: server.auth([server.authenticate]),
        handler: async (request, reply) => {
          await reply.send({
            user: request.user,
          });
        },
      });

      server.route({
        url: '/*',
        method: ['GET', 'POST', 'PUT', 'HEAD'],
        handler: async (request, reply) => {
          server.log.debug({
            msg: 'Processing Next.js request...',
            url: request.url,
          });
          try {
            request.raw.fetch = async <T>(options: RequestOptions, extraOptions = { cache: true }) => {
              server.log.debug({ msg: 'Fetch', options });
              const cacheKey = extraOptions.cache ? buildCacheKey(request) : '';
              if (extraOptions.cache) {
                const [err, cachedResponse] = await server.to(server.redis.get(cacheKey));
                if (err) {
                  server.log.error({ msg: 'Cache MISS for request', err });
                }
                server.log.debug({
                  msg: 'Cache HIT for request',
                  cachedResponse,
                });
                return JSON.parse(cachedResponse) as T;
              }
              const [err, response] = await server.to<FetcherResponse<T>>(
                server.fetcher<T>({
                  ...(options ?? {}),
                  headers: {
                    ...options?.headers,
                    ...pick(TRACING_HEADERS, request.headers),
                    authorization: `Bearer ${request.user.token}`,
                  },
                }),
              );
              if (err || response.statusCode !== 200) {
                server.log.error({ msg: 'Fetch request failed', err });

                // rethrow error
                throw err;
              }

              if (extraOptions.cache && response.body) {
                await server.redis.set(cacheKey, JSON.stringify(response.body), 'EX', 300);
                server.log.debug({ msg: 'Cache set for request', cacheKey });
              }

              server.log.debug({
                msg: 'Fetch successful',
                origRequestUrl: request.url,
                fetchPath: options.path,
              });

              return response.body;
            };

            await nextjsRouteHandler(request.raw, reply.raw);
          } catch (error) {
            server.log.error(error);
            await reply.code(500).send('Internal Server Error');
          }
        },
      });
    });

    return server;
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};
