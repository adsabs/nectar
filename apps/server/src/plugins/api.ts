import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import {
  IADSApiSearchParams,
  IADSApiSearchResponse,
} from '../../../client/src/api';
import { TRACING_HEADERS } from '../config';
import { pick } from '../lib/utils';
import { BootstrapResponse } from '../types';
import { buildCacheKey } from './cache';
import { FetcherResponse } from './fetcher';

// Type for the bootstrapToken function, handling the retrieval and processing of bootstrap tokens.
export type BootstrapTokenFn = (
  request: FastifyRequest,
  sessionCookie?: string,
) => Promise<FetcherResponse<BootstrapResponse>>;

export type SearchFn = (
  request: FastifyRequest,
  params: IADSApiSearchParams,
) => Promise<FetcherResponse<IADSApiSearchResponse>>;

const apiPlugin: FastifyPluginAsync = async (server) => {
  const search: SearchFn = async (request, query) => {
    server.log.debug({ msg: 'search plugin', query });
    const cacheKey = buildCacheKey(request);
    try {
      const cachedResponse = await server.redis.get(cacheKey);
      if (cachedResponse) {
        server.log.debug({ msg: 'Cache hit for search request', cacheKey });
        return JSON.parse(cachedResponse) as IADSApiSearchResponse;
      }
    } catch (err) {
      server.log.error({ msg: 'Cache get failed', err });
    }
    // Ensure the user has a valid session before making the search request.
    await server.api.bootstrapToken(request);
      const [err, response] = await server.to<FetcherResponse<IADSApiSearchResponse>>(server.fetcher<IADSApiSearchResponse>({
        path: 'SEARCH',
        method: 'GET',
        headers: {
          ...pick(TRACING_HEADERS, request.headers),
          Authorization: `Bearer ${request.user.token}`,
        },
        query,
      }));

      if (err) {
        server.log.error({ msg: 'Search request failed', err });
        return response.body;
      }

      server.log.debug({
        msg: 'Search request successful',
        head: response.headers,
      });
      await server.redis.set(
        cacheKey,
        JSON.stringify(response.body),
        'EX',
        300,
      );
      server.log.debug({
        msg: 'Cache set for search request',
        cacheKey,
        body: response.body,
      });
      return response.body;
    }
  };
  server.decorate('api', {
    search,
  });
};

export default fp(apiPlugin, {
  name: 'api',
  dependencies: ['fetcher', 'auth'],
});
