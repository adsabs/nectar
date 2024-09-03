import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { IADSApiSearchResponse } from '../../../client/src/api';
import { TRACING_HEADERS } from '../config';
import { searchFields } from '../lib/api';
import { omit, pick } from '../lib/utils';
import { DetailsResponse, SearchResponse } from '../types';
import { buildCacheKey } from './cache';
import { FetcherResponse } from './fetcher';

const getSearchParams = (params: IADSApiSearchResponse['responseHeader']['params']) => {
  return omit(['internal_logging_params', 'wt', 'fl', 'start', 'rows', 'fq'], params);
};

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
      let searchParams = null;
      if (searchCacheKey) {
        server.log.debug({ searchCacheKey }, 'Checking search cache');
        const [, searchCacheResponse] = await server.to<string | null>(server.redis.get(searchCacheKey));
        if (searchCacheResponse) {
          server.log.debug({ searchCacheResponse, searchCacheKey }, 'Cache hit for search');
          const searchResponse = JSON.parse(searchCacheResponse) as SearchResponse;
          const doc = searchResponse.response.response.docs.find((doc) => doc.id === id);
          searchParams = getSearchParams(searchResponse.response.responseHeader.params);
          if (doc) {
            const res: DetailsResponse = {
              doc,
              query: searchParams,
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
        if (!token || token === '') {
          server.log.warn({ token }, 'Missing or empty token for document search');
          return {
            doc: null,
            query: searchParams,
            error: {
              statusCode: 401,
              errorMsg: 'No Token',
              friendlyMessage: 'No Token',
            },
          };
        }

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

        if (err || !response || response.statusCode !== 200) {
          server.log.error({ msg: 'Details fetch failed', err, response, query }, 'Error during document search');
          return {
            doc: null,
            query: searchParams,
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
          query: searchParams,
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

        server.log.info(
          { docId: id, newToken: refreshResponse.body.access_token },
          'Token refreshed successfully, retrying document fetch',
        );
        // Retry the search with the refreshed token, but safeguard against infinite loops
        detailsResponse = await executeSearch(refreshResponse.body.access_token);
        if (detailsResponse.error?.statusCode === 401) {
          server.log.warn(
            { docId: id },
            'Repeated 401 Unauthorized after token refresh, aborting retry to avoid infinite loop',
          );
          return detailsResponse; // Prevent infinite loop by returning response after a second 401
        }
      }

      server.log.info({ docId: id }, 'Document fetch process completed');
      return detailsResponse;
    };

  server.addHook('preHandler', (request, reply, done) => {
    request.raw.details = getDetailsHandler(request, reply);
    done();
  });
};

export default fp(details, {
  name: 'details',
  dependencies: ['cache', 'fetcher'], // Add dependencies as needed
});
