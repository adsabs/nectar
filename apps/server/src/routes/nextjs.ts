import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';
import { Value } from '@sinclair/typebox/value';
import { FastifyRequest } from 'fastify';
import { TRACING_HEADERS } from 'src/config';
import { buildCacheKey } from 'src/plugins/cache';
import { FetcherResponse } from 'src/plugins/fetcher';

import { IADSApiSearchParams, IADSApiSearchResponse } from '../../../client/src/api';
import { pick } from '../lib/utils';
import { searchParamsSchema } from '../types';

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

  const getDetailsHandler = (request: FastifyRequest) => async () => {
    const id = extractIdentifier(request.url);

    if (!id) {
      return {
        doc: null,
        error: {
          statusCode: 400,
          errorMsg: 'Bad Request',
          friendlyMessage: 'Invalid document identifier',
        },
      };
    }

    const cacheKey = buildCacheKey(request);

    // Check the cache for the document
    const cachedResponse = await getCachedResponse(server, cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check for search cache using the search cookie
    const searchCacheKey = request.cookies.search;
    if (searchCacheKey) {
      const searchResponse = await getSearchCacheResponse(server, searchCacheKey, id);
      if (searchResponse) {
        await cacheResponse(server, cacheKey, searchResponse);
        return searchResponse;
      }
    }

    // Fetch details directly if not found in the cache
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
          statusCode: response.statusCode,
          errorMsg: err?.message || 'Unknown error',
          friendlyMessage: 'Failed to fetch details. Please try again later.',
        },
      };
    }

    // Cache and return the response
    const res = {
      doc: response.body.response.docs[0],
      query: null,
      error: null,
    };
    await cacheResponse(server, cacheKey, res);
    return res;

    function getCachedResponse(server, cacheKey) {
      return server.to(server.redis.get(cacheKey)).then(([err, cachedResponse]) => {
        if (err || !cachedResponse) {
          return null;
        }
        server.log.debug({ cachedResponse }, 'Cache response');
        return JSON.parse(cachedResponse);
      });
    }

    function getSearchCacheResponse(server, searchCacheKey, id) {
      return server.to(server.redis.get(searchCacheKey)).then(([err, searchCacheResponse]) => {
        if (err || !searchCacheResponse) {
          return null;
        }
        const searchResponse = JSON.parse(searchCacheResponse) as IADSApiSearchResponse;
        const doc = searchResponse.response.docs.find((doc) => doc.id === id);
        if (!doc) {
          return null;
        }
        return {
          doc,
          query: searchResponse.responseHeader.params,
          error: null,
        };
      });
    }

    function cacheResponse(server, cacheKey, response) {
      return server.to(server.redis.set(cacheKey, JSON.stringify(response), 'EX', 300));
    }
  };

  const getSearchHandler = (request: FastifyRequest) => async () => {
    const reqQuery = Value.Parse(searchParamsSchema, request.query);
    const query = {
      fl: searchFields,
      rows: reqQuery.n,
      start: (reqQuery.p - 1) * reqQuery.n,
      q: reqQuery.q,
      sort: reqQuery.sort as IADSApiSearchParams['sort'],
    } as IADSApiSearchParams;

    // check cache
    const cacheKey = buildCacheKey(request);

    const [, cacheResponse] = await server.to(server.redis.get(cacheKey));
    if (cacheResponse) {
      server.log.debug({ cacheResponse }, 'Cache response');
      return {
        response: JSON.parse(cacheResponse) as IADSApiSearchResponse,
        query,
        error: null,
      };
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
      server.log.error({ err, query }, 'Error fetching search results');

      return {
        response: err?.body as IADSApiSearchResponse,
        query,
        error: err.message,
      };
    }

    const [cacheErr] = await server.to(server.redis.set(cacheKey, JSON.stringify(response.body), 'EX', 300));
    if (cacheErr) {
      server.log.error({ err: cacheErr }, 'Cache set failed');
    }

    return {
      response: response.body,
      query,
      error: null,
    };
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
