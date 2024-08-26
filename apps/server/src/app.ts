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
import { NextServer } from 'next/dist/server/next';
import path from 'path';

import { loadConfig } from './config';
import { noop } from './lib/utils';
import AuthPlugin from './plugins/auth';
import CachePlugin from './plugins/cache';
import DetailsPlugin from './plugins/details';
import FetcherPlugin from './plugins/fetcher';
import ProxyPlugin from './plugins/proxy';
import RoutesPlugin from './plugins/routes';
import SearchPlugin from './plugins/search';
import { ScixSession } from './types';

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

  try {
    await nextApp.prepare();
    server.decorate('nextAppContext', nextApp as NextServer);

    // Register external plugins
    await server.register(FastifyEnv, { schema, dotenv: false });
    await server.register(FastifySensible);
    await server.register(FastifyHelmet, helmetConfig);
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
      verify: {
        onlyCookie: true,
      },
      formatUser: (session: ScixSession) => {
        return session;
      },
      decoratorName: 'auth',
      sign: {
        expiresIn: '1h',
      },
    });
    await server.register(FastifyAuth);
    await server.register(FastifyCors, {
      origin: 'http://locahost:8000',
      credentials: true,
    });

    if (server.config.NODE_ENV === 'production') {
      await server.register(FastifyStatic, {
        root: [path.join(nextDir, '.next/static')],
        prefix: '/_next/static/',
        logLevel: 'debug',
        setHeaders: (res) => {
          void res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
      });
    }

    // Register internal plugins
    await server.register(CachePlugin);
    await server.register(FetcherPlugin);
    await server.register(AuthPlugin);
    await server.register(SearchPlugin);
    await server.register(DetailsPlugin);
    await server.register(ProxyPlugin);
    await server.register(RoutesPlugin);

    Sentry.setupFastifyErrorHandler(server);

    return server;
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};
