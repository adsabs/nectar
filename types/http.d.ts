import type { FastifyRedis } from '@fastify/redis';

declare module 'node:http' {
  interface IncomingMessage {
    session: {
      user: SessionData['user'];
    };
    redis: FastifyRedis;
  }
}
