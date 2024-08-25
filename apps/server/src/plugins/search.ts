import { Value } from '@sinclair/typebox/value';
import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { pick } from 'src/lib/utils';

import { IADSApiSearchParams, IADSApiSearchResponse } from '../../../client/src/api';
import { TRACING_HEADERS } from '../config';
import { searchFields } from '../lib/api';
import { searchParamsSchema, SearchResponse } from '../types';
import { buildCacheKey } from './cache';
import { FetcherResponse } from './fetcher';

const search: FastifyPluginCallback = async (server) => {
  const getSearchHandler = (request: FastifyRequest) => async (): Promise<SearchResponse> => {
    const reqQuery = Value.Parse(searchParamsSchema, request.query);

    const query: IADSApiSearchParams = {
      fl: searchFields,
      rows: reqQuery.n,
      start: (reqQuery.p - 1) * reqQuery.n,
      q: reqQuery.q,
      sort: reqQuery.sort as IADSApiSearchParams['sort'],
    };

    const cacheKey = buildCacheKey(request);

    const [, cacheResponse] = await server.to<string | null>(server.redis.get(cacheKey));
    if (cacheResponse) {
      server.log.debug({ cacheResponse }, 'Cache response');
      return JSON.parse(cacheResponse) as SearchResponse;
    }

    const [err, response] = await server.to<FetcherResponse<IADSApiSearchResponse>>(
      server.fetcher<SearchResponse>({
        path: 'SEARCH',
        query,
        headers: {
          authorization: `Bearer ${request.auth.user.token}`,
          ...pick(TRACING_HEADERS, request.headers),
        },
      }),
    );

    if (err || response.statusCode !== 200) {
      server.log.error({ err, query }, 'Error fetching search results');

      return {
        response: null,
        query,
        error: {
          statusCode: response?.statusCode || 500,
          errorMsg: err?.message || 'Failed to fetch search results',
          friendlyMessage: 'Failed to fetch search results. Please try again later.',
        },
      };
    }

    const res: SearchResponse = {
      response: response.body,
      query,
      error: null,
    };

    const [cacheErr] = await server.to(server.redis.set(cacheKey, JSON.stringify(res), 'EX', 300));
    if (cacheErr) {
      server.log.error({ err: cacheErr }, 'Cache set failed');
    }

    return res;
  };

  server.addHook('preHandler', (request, _reply, done) => {
    request.raw.search = getSearchHandler(request);
    done();
  });
};

export default fp(search, {
  name: 'search',
  dependencies: ['cache', 'fetcher'],
});
