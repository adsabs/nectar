import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';

import { IADSApiSearchParams, IDocsEntity } from '../../../client/src/api';

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
];

const detailsFields = [
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

type DetailsData = {
  doc: IDocsEntity;
  query: IADSApiSearchParams | null;
  error?: {
    errorMsg: string;
    statusCode: number;
    friendlyMessage: string;
  };
};

export const searchRoute: FastifyPluginCallbackTypebox = (server) => {
  // server.route({
  //   schema: {
  //     params: T.Object({
  //       id: T.String(),
  //       page: T.Union([T.Literal('abstract')]),
  //     }),
  //   },
  //   url: '/abs/:id/:page',
  //   method: ['GET'],
  //   handler: async (request, reply) => {
  //     server.log.debug({
  //       msg: 'Details Page Request',
  //       url: request.url,
  //       user: request.user,
  //     });
  //
  //     request.raw.details = {
  //       doc: {},
  //       query: null,
  //     };
  //
  //     const cacheKey = buildCacheKey(request);
  //     const [, cachedResponse] = await server.to(server.redis.get(cacheKey));
  //     if (cachedResponse) {
  //       request.raw.details = JSON.parse(cachedResponse) as DetailsData;
  //     } else {
  //       const searchCacheKey = request.cookies['search'];
  //       const [, cachedSearchResponse] = await server.to(
  //         server.redis.get(searchCacheKey),
  //       );
  //       if (cachedSearchResponse) {
  //         const searchResponse = JSON.parse(
  //           cachedSearchResponse,
  //         ) as IADSApiSearchResponse;
  //         const doc = searchResponse.response.docs.find(
  //           (doc) => doc.bibcode === request.params.id,
  //         );
  //         request.raw.details = {
  //           doc,
  //           query: searchResponse.responseHeader.params,
  //         };
  //       } else {
  //         const query = {
  //           fl: [...searchFields, ...detailsFields],
  //           rows: 1,
  //           q: `identifier:${request.params.id}`,
  //         };
  //
  //         const [err, response] = await server.to<
  //           FetcherResponse<IADSApiSearchResponse>
  //         >(
  //           server.fetcher<IADSApiSearchResponse>({
  //             path: 'SEARCH',
  //             query,
  //             headers: {
  //               authorization: `Bearer ${request.user.token}`,
  //               ...pick(TRACING_HEADERS, request.headers),
  //             },
  //           }),
  //         );
  //
  //         if (err || response.statusCode !== 200) {
  //           server.log.error({ msg: 'Details fetch failed', err });
  //           request.raw.details.error = {
  //             statusCode: response.statusCode,
  //             errorMsg: err.message,
  //             friendlyMessage:
  //               'Failed to fetch details. Please try again later.',
  //           };
  //         } else {
  //           request.raw.details = {
  //             doc: response.body.response.docs[0],
  //             query: null,
  //           };
  //         }
  //       }
  //     }
  //
  //     if (request.raw.details.doc) {
  //       const [err] = await server.to(
  //         server.redis.set(
  //           cacheKey,
  //           JSON.stringify(request.raw.details),
  //           'EX',
  //           300,
  //         ),
  //       );
  //       if (err) {
  //         server.log.error({ msg: 'Cache set failed', err });
  //       }
  //     }
  //
  //     return await server.nextAppContext.getRequestHandler()(
  //       request.raw,
  //       reply.raw,
  //     );
  //   },
  // });
  //
  // server.route({
  //   schema: {
  //     querystring: searchParamsSchema,
  //   },
  //   url: '/search',
  //   method: ['GET'],
  //   handler: async (request, reply) => {
  //     server.log.debug({
  //       msg: 'Search Request',
  //       url: request.url,
  //       user: request.user,
  //     });
  //
  //     const query = {
  //       fl: [...searchFields, ...detailsFields],
  //       rows: request.query.n,
  //       start: (request.query.p - 1) * request.query.n,
  //       q: request.query.q,
  //       sort: request.query.sort as IADSApiSearchParams['sort'],
  //     };
  //
  //     request.raw.search = {
  //       response: null,
  //       query,
  //       page: request.query.p,
  //     };
  //
  //     server.log.debug({ query });
  //     const cacheKey = buildCacheKey(request);
  //     const [cacheErr, cacheResponse] = await server.to(
  //       server.redis.get(cacheKey),
  //     );
  //     server.log.debug({ cacheErr, cacheResponse });
  //     if (cacheErr) {
  //       server.log.error({ msg: 'Cache get failed', err: cacheErr });
  //     } else if (cacheResponse) {
  //       server.log.debug({ msg: 'Cache hit for key', cacheKey });
  //       request.raw.search.response = JSON.parse(
  //         cacheResponse,
  //       ) as IADSApiSearchResponse;
  //     } else {
  //       const [err, response] = await server.to<
  //         FetcherResponse<IADSApiSearchResponse>
  //       >(
  //         server.fetcher<IADSApiSearchResponse>({
  //           path: 'SEARCH',
  //           query,
  //           headers: {
  //             authorization: `Bearer ${request.user.token}`,
  //             ...pick(TRACING_HEADERS, request.headers),
  //           },
  //         }),
  //       );
  //
  //       if (err || response.statusCode !== 200) {
  //         server.log.error({ msg: 'Search Request Failed', err });
  //         request.raw.search.error = {
  //           errorMsg: err.message,
  //           statusCode: response.statusCode,
  //           friendlyMessage: 'Search request failed. Please try again.',
  //         };
  //       } else {
  //         // Cache the response
  //         const [err] = await server.to(
  //           server.redis.set(
  //             cacheKey,
  //             JSON.stringify(response.body),
  //             'EX',
  //             300,
  //           ),
  //         );
  //         if (err) {
  //           server.log.error({ msg: 'Cache set failed', err });
  //         }
  //
  //         request.raw.search.response = response.body;
  //       }
  //     }
  //
  //     reply.raw.setHeader(
  //       'set-cookie',
  //       server.serializeCookie('search', cacheKey, {
  //         httpOnly: true,
  //         maxAge: 300,
  //         path: '/',
  //         sameSite: 'lax',
  //         secure: server.config.NODE_ENV === 'production',
  //       }),
  //     );
  //
  //     return await server.nextAppContext.getRequestHandler()(
  //       request.raw,
  //       reply.raw,
  //     );
  //   },
  // });
  return server;
};
