import { Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { pick } from 'ramda';
import { TRACING_HEADERS } from 'src/config';
import { searchParamsSchema } from 'src/types';

import { IADSApiSearchResponse } from '../../../client/src/api';
import { FetcherResponse } from './fetcher';

const ssrPlugin: FastifyPluginCallback = async (server) => {
  server.decorate('search', async (request) => {
    server.log.debug({
      msg: 'Search Request',
      url: request.url,
      user: request.user,
    });

    const parsedQuery: Static<typeof searchParamsSchema> = Value.Parse(searchParamsSchema, request.query);

    const query = {
      fl: [
        'bibcode',
        'title',
        'author',
        '[fields author=10]',
        'author_count',
        'pubdate',
        'bibstem',
        '[citations]',
        'citation_count',
        'citation_count_norm',
        'esources',
        'property',
        'data',
        'id',
      ],
      rows: parsedQuery.n,
      start: (parsedQuery.p - 1) * parsedQuery.n,
      q: parsedQuery.q,
      sort: parsedQuery.sort,
    };

    // check the cache for the response
    const [, cacheResponse] = await server.to(server.checkCache(request));
    if (cacheResponse) {
      return cacheResponse;
    }

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

    if (err) {
      server.log.error({ msg: 'Search Request Failed', err });
      throw err;
    }

    // Cache the response
    await server.setCache(request, response.body);

    return response.body;
  });
};

export default fp(ssrPlugin, {
  name: 'ssr',
  dependencies: ['cache', 'fetcher'],
});
