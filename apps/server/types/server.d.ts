import type { FastifyRedis } from '@fastify/redis';
import type { Session, SessionData } from '@fastify/secure-session';
import { IADSApiSearchResponse } from 'apps/client/src/api';
import { NextServer } from 'next/dist/server/next';

import { IADSApiSearchParams } from '../../client/src/api';
import { FetcherFn } from '../src/plugins/api';
import { BootstrapResponse, DetailsResponse, ScixSession, ScixUser, SearchResponse } from '../src/types';

declare module 'fastify' {
  import ToType = module;

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
      API_PREFIX: string;
    };
    fetcher: FetcherFn;
    verifyUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    nextAppContext: NextServer;
    checkCache: <Res>(request: FastifyRequest) => Promise<Res | null>;
    setCache: (request: FastifyRequest, data: unknown) => Promise<void>;
    search: (request: FastifyRequest) => Promise<IADSApiSearchResponse>;
    updateSession: (request: FastifyRequest, reply: FastifyReply, updates: Partial<ScixSession>) => Promise<boolean>;
    createAnonymousSession: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    refreshToken: (request: FastifyRequest, reply: FastifyReply) => ToType<BootstrapResponse>;
  }

  interface FastifyRequest {
    session: Session<SessionData>;
    redis: FastifyRedis;
    user: ScixUser;
    auth: ScixSession;
    externalSessionCookie: string;
    authCookie: string;
    getSearchHandler: (request: FastifyRequest) => () => Promise<SearchResponse>;
    getDetailsHandler: (request: FastifyRequest) => (id: string) => Promise<DetailsResponse>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    auth: ScixUser;
    search?: {
      params: Partial<IADSApiSearchParams>;
      cacheKey: string;
    };
  }
  type VerifyPayloadType = ScixSession;
}

declare module 'jest' {
  // empty namespace to avoid jest globals being added to the global scope
}
