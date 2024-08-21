import type { FastifyRedis } from '@fastify/redis';
import type { Session, SessionData } from '@fastify/secure-session';
import { IADSApiSearchResponse, IADSApiUserResponse } from 'apps/client/src/api';
import { NextServer } from 'next/dist/server/next';

import { BootstrapTokenFn, FetcherFn, SearchFn } from '../src/plugins/api';
import { ScixSession, ScixUser } from '../src/types';

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
      REDIS_URL: string;
      REDIS_KEY_PREFIX: string;
      CSRF_HEADER: string;
      API_BASE_DOMAIN_SERVER: string;
    };
    fetcher: FetcherFn;
    verifyUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    nextAppContext: NextServer;
    checkCache: <Res>(request: FastifyRequest) => Promise<Res | null>;
    setCache: (request: FastifyRequest, data: unknown) => Promise<void>;
    search: (request: FastifyRequest) => Promise<IADSApiSearchResponse>;
  }

  interface FastifyRequest {
    session: Session<SessionData>;
    redis: FastifyRedis;
    user: ScixUser;
    externalSessionCookie: string;
    authCookie: string;
  }
}

declare module 'jest' {
  // empty namespace to avoid jest globals being added to the global scope
}
