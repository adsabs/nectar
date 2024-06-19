import './lib/instrument';

import * as fs from 'node:fs';

import FastifyCookie from '@fastify/cookie';
import FastifyCors from '@fastify/cors';
import FastifyEnv from '@fastify/env';
import FastifyHelmet from '@fastify/helmet';
import FastifySensible from '@fastify/sensible';
import FastifyStatic from '@fastify/static';
import * as Sentry from '@sentry/node';
import Fastify, { FastifyInstance } from 'fastify';
import next from 'next';
import path from 'path';

import { loadConfig } from './config';
import CachePlugin from './plugins/cache.js';
import FetcherPlugin from './plugins/fetcher.js';
import HandlersPlugin from './plugins/handlers.js';
import SessionPlugin from './plugins/session.js';

const isProduction = process.env.NODE_ENV === 'production';

const initialize = async () => {
  const { schema, helmetConfig } = loadConfig();

  const nextDir = isProduction ? __dirname : path.resolve(__dirname, '../../apps/client');

  const nextConfig = isProduction
    ? JSON.parse(fs.readFileSync(path.join(__dirname, 'required-server-files.json'), { encoding: 'utf-8' }))
    : undefined;

  const server: FastifyInstance = Fastify({
    logger: true,
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10),
  });

  const nextApp = next({
    dev: !isProduction,
    conf: nextConfig,
    customServer: true,
    httpServer: server.server,
    port: parseInt(process.env.PORT, 10),
    hostname: 'localhost',
    dir: nextDir,
    quiet: !isProduction,
  });

  try {
    await nextApp.prepare();

    // Loads environment vars and decorates the fastify instance with config
    await server.register(FastifyEnv, { schema, dotenv: false, logLevel: 'debug' });

    // Register CORS plugin
    await server.register(FastifyCors, { origin: false });

    // Register helmet plugin
    await server.register(FastifyHelmet, helmetConfig);

    // Register the cookies plugin
    await server.register(FastifyCookie, { secret: server.config.COOKIE_SECRET });

    // Register sensible plugin
    await server.register(FastifySensible);

    // Register plugins
    await server.register(CachePlugin);
    await server.register(FetcherPlugin);
    await server.register(SessionPlugin);
    await server.register(HandlersPlugin);

    // Serve static files
    await server.register(FastifyStatic, { root: path.join(nextDir, 'public'), prefix: '/static/' });

    server.route({
      url: '/*',
      method: ['GET', 'POST', 'PUT', 'DELETE'],
      handler: async (request, reply) => {
        try {
          request.raw.redis = server.redis;
          await nextApp.getRequestHandler()(request.raw, reply.raw);
        } catch (error) {
          server.log.error(error);
          await reply.code(500).send('Internal Server Error');
        }
      },
    });

    Sentry.setupFastifyErrorHandler(server);
    server.listen({ port: server.config.PORT }, (err) => {
      if (err) {
        server.log.error(err);
        process.exit(1);
      }
    });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

void initialize();
