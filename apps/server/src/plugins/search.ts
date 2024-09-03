import { Value } from '@sinclair/typebox/value';
import { createHash } from 'crypto';
import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { pick } from 'src/lib/utils';

import { IADSApiSearchParams, IADSApiSearchResponse } from '../../../client/src/api';
import { TRACING_HEADERS } from '../config';
import { searchFields } from '../lib/api';
import { searchParamsSchema, SearchResponse } from '../types';
import { FetcherError, FetcherResponse } from './fetcher';

const buildCacheKey = (params: IADSApiSearchParams): string => {
  const encryptedData = createHash('md5').update(JSON.stringify(params));
  return encryptedData.digest('hex');
};

const search: FastifyPluginCallback = async (server) => {
  const getSearchHandler =
    (request: FastifyRequest, reply: FastifyReply) =>
    async (params: Partial<IADSApiSearchParams> = {}): Promise<SearchResponse> => {
      const reqQuery = Value.Parse(searchParamsSchema, request.query);

      const query: IADSApiSearchParams = {
        fl: searchFields,
        rows: reqQuery.n,
        start: (reqQuery.p - 1) * reqQuery.n,
        q: reqQuery.q,
        sort: reqQuery.sort as IADSApiSearchParams['sort'],
        ...params,
      };

      const cacheKey = buildCacheKey(query);

      const [, cacheResponse] = await server.to<string | null>(server.redis.get(cacheKey));
      if (cacheResponse) {
        server.log.debug({ cacheResponse }, 'Cache response');
        return JSON.parse(cacheResponse) as SearchResponse;
      }

      const executeSearch = async (token: string): Promise<SearchResponse> => {
        const [err, response] = await server.to<FetcherResponse<IADSApiSearchResponse>>(
          server.fetcher<SearchResponse>({
            path: 'SEARCH',
            query,
            headers: {
              authorization: `Bearer ${token}`,
              ...pick(TRACING_HEADERS, request.headers),
            },
          }),
        );

        const searchError = err as FetcherError;

        if (searchError || response.statusCode !== 200) {
          server.log.error({ err, query }, 'Error fetching search results');

          return {
            response: null,
            query,
            error: {
              statusCode: searchError.statusCode || 500,
              errorMsg: searchError?.message || 'Failed to fetch search results',
              friendlyMessage: 'Failed to fetch search results. Please try again later.',
            },
          };
        }

        return {
          response: response.body,
          query,
          error: null,
        };
      };

      let searchResponse = await executeSearch(request.auth.user.token);

      server.log.debug({ searchResponse }, 'Search response');

      // Check for 401 status code and attempt token refresh
      if (searchResponse.error?.statusCode === 401) {
        server.log.info('Received 401 Unauthorized, attempting to refresh token');

        const [refreshErr, refreshResponse] = await server.refreshToken(request, reply);

        if (refreshErr || !refreshResponse || refreshResponse.statusCode !== 200) {
          server.log.error({ refreshErr, refreshResponse }, 'Token refresh failed');
          return searchResponse; // Return the original 401 response
        }

        // Retry the search with the refreshed token
        searchResponse = await executeSearch(refreshResponse.body.access_token);
      }

      if (!searchResponse.error) {
        const [cacheErr] = await server.to(server.redis.set(cacheKey, JSON.stringify(searchResponse), 'EX', 300));
        if (cacheErr) {
          server.log.error({ err: cacheErr }, 'Cache set failed');
        } else {
          reply.raw.setHeader(
            'set-cookie',
            server.serializeCookie('search', cacheKey, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: false,
            }),
          );
        }
      }

      return searchResponse;
    };

  server.addHook('preHandler', (request, reply, done) => {
    request.raw.search = getSearchHandler(request, reply);
    done();
  });
};

export default fp(search, {
  name: 'search',
  dependencies: ['cache', 'fetcher', 'auth'],
});
