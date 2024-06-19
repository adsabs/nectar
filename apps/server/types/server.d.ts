import type { FastifyRedis } from '@fastify/redis';
import type { Session, SessionData } from '@fastify/secure-session';
import { HookHandlerDoneFunction } from 'fastify';

import { Fetcher } from '../src/plugins/fetcher';
import { IBootstrapPayload } from '../src/types';

declare module '@fastify/secure-session' {
  interface SessionData {
    user: IBootstrapPayload;
    adsws_session_cookie: string;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      NODE_ENV: string;
      COOKIE_SECRET: string;
      KEEP_ALIVE_TIMEOUT: number;
      SCIX_SESSION_COOKIE_NAME: string;
      ADS_SESSION_COOKIE_NAME: string;
      PORT: number;
      API_HOST_SERVER: string;
    };
    verifyUser: (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => void;
    fetcher: Fetcher;
  }

  interface FastifyRequest {
    session: Session<SessionData>;
    redis: FastifyRedis;
  }
}

declare module 'node:http' {
  interface IncomingMessage {
    session: Session<SessionData>;
    redis: FastifyRedis;
  }
}
