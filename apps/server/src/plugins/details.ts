import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
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
    (request: FastifyRequest, reply: FastifyReply) =>
    async (id: string): Promise<DetailsResponse> => {
      if (!id) {
        server.log.warn({ id }, 'Received invalid document identifier');
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
      server.log.debug({ cacheKey }, 'Generated cache key');

      // Check the cache for the document
      const [, cachedResponse] = await server.to<string | null>(server.redis.get(cacheKey));
      if (cachedResponse) {
        server.log.debug({ cachedResponse, cacheKey }, 'Cache hit for document');
        return JSON.parse(cachedResponse) as DetailsResponse;
      }

      // Check for search cache using the search cookie
      const searchCacheKey = request.cookies.search;
      if (searchCacheKey) {
        server.log.debug({ searchCacheKey }, 'Checking search cache');
        const [, searchCacheResponse] = await server.to<string | null>(server.redis.get(searchCacheKey));
        if (searchCacheResponse) {
          server.log.debug({ searchCacheResponse, searchCacheKey }, 'Cache hit for search');
          const searchResponse = JSON.parse(searchCacheResponse) as SearchResponse;
          const doc = searchResponse.response.response.docs.find((doc) => doc.id === id);
          if (doc) {
            const res: DetailsResponse = {
              doc,
              query: searchResponse.response.responseHeader.params,
              error: null,
            };
            await server.to(server.redis.set(cacheKey, JSON.stringify(res), 'EX', 300));
            server.log.debug({ docId: id, cacheKey }, 'Document found in search cache and cached');
            return res;
          }
        }
      }

      // Function to execute the search
      const executeSearch = async (token: string): Promise<DetailsResponse> => {
        const query = {
          fl: searchFields,
          rows: 1,
          q: `identifier:${id}`,
        };

        server.log.debug({ query }, 'Executing document search');
        const [err, response] = await server.to<FetcherResponse<IADSApiSearchResponse>>(
          server.fetcher<IADSApiSearchResponse>({
            path: 'SEARCH',
            query,
            headers: {
              authorization: `Bearer ${token}`,
              ...pick(TRACING_HEADERS, request.headers),
            },
          }),
        );

        if (err || response.statusCode !== 200) {
          server.log.error({ msg: 'Details fetch failed', err, query }, 'Error during document search');
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

        server.log.info({ docId: id }, 'Document fetched successfully');
        // Cache and return the fetched document
        const res: DetailsResponse = {
          doc: response.body.response.docs[0],
          query: null,
          error: null,
        };
        await server.to(server.redis.set(cacheKey, JSON.stringify(res), 'EX', 300));
        server.log.debug({ docId: id, cacheKey }, 'Document cached successfully');
        return res;
      };

      let detailsResponse = await executeSearch(request.auth.user.token);

      // Check for 401 status code and attempt token refresh
      if (detailsResponse.error?.statusCode === 401) {
        server.log.info({ docId: id }, 'Received 401 Unauthorized, attempting to refresh token');

        const [refreshErr, refreshResponse] = await server.refreshToken(request, reply);

        if (refreshErr || !refreshResponse || refreshResponse.statusCode !== 200) {
          server.log.error({ refreshErr, refreshResponse }, 'Token refresh failed');
          return detailsResponse; // Return the original 401 response
        }

        server.log.info({ docId: id }, 'Token refreshed successfully, retrying document fetch');
        // Retry the search with the refreshed token
        detailsResponse = await executeSearch(refreshResponse.body.access_token);
      }

      server.log.info({ docId: id }, 'Document fetch process completed');
      return detailsResponse;
    };

  server.addHook('preHandler', (request, reply, done) => {
    server.log.debug({ method: request.method, url: request.url }, 'Initializing document fetch handler');
    request.raw.details = getDetailsHandler(request, reply);
    done();
  });
};

export default fp(details, {
  name: 'details',
  dependencies: ['cache', 'fetcher'], // Add dependencies as needed
});
