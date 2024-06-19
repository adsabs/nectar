import type { FastifyRedis } from '@fastify/redis';

import {
  IADSApiSearchParams,
  IADSApiSearchResponse,
} from '../apps/client/src/api';
import { FetcherError, RequestOptions } from 'src/plugins/fetcher';

declare module 'node:http' {
  interface IncomingMessage {
    session: {
      user: SessionData['user'];
    };
    fetch: <T>(
      options: RequestOptions,
      extraOptions = { cache: true },
    ) => Promise<T | { error: string }>;
  }
}
