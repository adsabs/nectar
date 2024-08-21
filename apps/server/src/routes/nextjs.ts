import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import { Value } from '@sinclair/typebox/value';
import { FastifyRequest } from 'fastify';
import { TRACING_HEADERS } from 'src/config';
import { buildCacheKey } from 'src/plugins/cache';
import { FetcherResponse } from 'src/plugins/fetcher';

import { IADSApiSearchParams, IADSApiSearchResponse } from '../../../client/src/api';
import { pick } from '../lib/utils';
import { DetailsResponse, searchParamsSchema, SearchResponse } from '../types';

const searchFields = [
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
  'read_count',
  'abstract',
  'comment',
  `[fields orcid_pub=${50}]`,
  `[fields orcid_user=${50}]`,
  `[fields orcid_other=${50}]`,
  'orcid_pub',
  'orcid_user',
  'orcid_other',
  'doi',
  'pub_raw',
  'publisher',
  'keyword',
  'comment',
  'pubnote',
  'book_author',
  'gpn',
  'gpn_id',
];

export const nextjsRoute: FastifyPluginCallbackTypebox = async (server) => {
  function extractIdentifier(url: string): string {
    const match = url.match(/\/abs\/([^/]+)(\/.*)?$/);
    return match ? match[1] : null;
  }

  const getDetailsHandler = (request: FastifyRequest) => async (): Promise<DetailsResponse> => {
    const id = extractIdentifier(request.url);
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

  server.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/search')) {
      const cacheKey = buildCacheKey(request);

      reply.raw.setHeader(
        'set-cookie',
        server.serializeCookie('search', cacheKey, {
          path: '/',
          httpOnly: true,
          secure: server.config.NODE_ENV === 'production',
        }),
      );
    }
  });

  server.route({
    url: '/*',
    method: ['GET', 'POST', 'PUT', 'HEAD'],
    handler: async (request, reply) => {
      server.log.debug({
        msg: 'Processing Next.js request...',
        url: request.url,
      });
      try {
        request.raw.search = getSearchHandler(request);
        request.raw.details = getDetailsHandler(request);
        await server.nextAppContext.getRequestHandler()(request.raw, reply.raw);
      } catch (error) {
        server.log.error(error);
        return reply.internalServerError();
      }
    },
  });
  return server;
};
