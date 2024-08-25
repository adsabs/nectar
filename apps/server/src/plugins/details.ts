import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { IADSApiSearchResponse } from '../../../client/src/api';
import { TRACING_HEADERS } from '../config';
import { searchFields } from '../lib/api';
import { pick } from '../lib/utils';
import { DetailsResponse, SearchResponse } from '../types';
import { buildCacheKey } from './cache';
import { FetcherResponse } from './fetcher';

const details: FastifyPluginCallback = async (server) => {
  const getDetailsHandler =
    (request: FastifyRequest) =>
    async (id: string): Promise<DetailsResponse> => {
      if (!id) {
        return {
          doc: null,
          query: null,
          error: {
            statusCode: 400,
            errorMsg: 'Bad Request',
            friendlyMessage: 'Invalid document identifier',
          },
        };
      }

      const cacheKey = buildCacheKey(request);

      // Check the cache for the document
      const [, cachedResponse] = await server.to<string | null>(server.redis.get(cacheKey));
      if (cachedResponse) {
        server.log.debug({ cachedResponse }, 'Cache response');
        return JSON.parse(cachedResponse) as DetailsResponse;
      }

      // Check for search cache using the search cookie
      const searchCacheKey = request.cookies.search;
      if (searchCacheKey) {
        const [, searchCacheResponse] = await server.to<string | null>(server.redis.get(searchCacheKey));
        if (searchCacheResponse) {
          const searchResponse = JSON.parse(searchCacheResponse) as SearchResponse;
          const doc = searchResponse.response.response.docs.find((doc) => doc.id === id);
          if (doc) {
            const res: DetailsResponse = {
              doc,
              query: searchResponse.response.responseHeader.params,
              error: null,
            };
            await server.to(server.redis.set(cacheKey, JSON.stringify(res), 'EX', 300));
            return res;
          }
        }
      }

      // Fetch the details directly if not found in cache
      const query = {
        fl: searchFields,
        rows: 1,
        q: `identifier:${id}`,
      };

      const [err, response] = await server.to<FetcherResponse<IADSApiSearchResponse>>(
        server.fetcher<IADSApiSearchResponse>({
          path: 'SEARCH',
          query,
          headers: {
            authorization: `Bearer ${request.user.token}`,
            ...pick(TRACING_HEADERS, request.headers),
          },
        }),
      );

      if (err || response.statusCode !== 200) {
        server.log.error({ msg: 'Details fetch failed', err });

        return {
          doc: null,
          query: null,
          error: {
            statusCode: response?.statusCode || 500,
            errorMsg: err?.message || 'Failed to fetch details',
            friendlyMessage: 'Failed to fetch details. Please try again later.',
          },
        };
      }

      // Cache and return the fetched document
      const res: DetailsResponse = {
        doc: response.body.response.docs[0],
        query: null,
        error: null,
      };
      await server.to(server.redis.set(cacheKey, JSON.stringify(res), 'EX', 300));
      return res;
    };

  server.addHook('preHandler', (request) => {
    request.raw.details = getDetailsHandler(request);
  });
};

export default fp(details, {
  name: 'details',
  dependencies: ['cache', 'fetcher'], // Add dependencies as needed
});
