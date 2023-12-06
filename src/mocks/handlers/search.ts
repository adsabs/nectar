import { rest } from 'msw';
import { ApiTargets, FacetField, IADSApiSearchResponse } from '@api';
import qs from 'qs';
import faker from '@faker-js/faker';
import { generateFacetResponse } from '@mocks/generators/facets';
import { clamp, map, range } from 'ramda';
import { api, apiHandlerRoute, highlights_mocks, ids_mocks, ranRange } from '@mocks/mockHelpers';
import { generateSearchResponse } from '@mocks/generators/search';

export const searchHandlers = [
  rest.get(apiHandlerRoute(ApiTargets.SEARCH), async (req, res, ctx) => {
    const params = qs.parse(req.url.search.slice(1));

    if (typeof params.cursorMark === 'string') {
      const rows = parseInt(params.rows as string, 10) ?? 10;
      const numFound = faker.datatype.number({ min: 1, max: 10000 });
      return res(
        ctx.status(200),
        ctx.json<IADSApiSearchResponse>({
          nextCursorMark: faker.random.alphaNumeric(18),
          response: {
            numFound,
            docs: map(() => ({
              bibcode: api.bibcode(),
            }))(range(0, clamp(1, 100, rows))),
          },
        }),
      );
    }

    if (params['json.facet']) {
      const parsed = JSON.parse(params['json.facet'] as string) as Record<string, { prefix: string }>;
      const facets: Record<string, ReturnType<typeof generateFacetResponse>> = {};
      Object.keys(parsed).forEach((id) => {
        facets[id] = generateFacetResponse({
          id: id as FacetField,
          prefix: parsed[id].prefix,
        });
      });

      return res(ctx.status(200), ctx.json<IADSApiSearchResponse>(generateSearchResponse({ facets })));
    }

    // abstract preview
    if (params.fl === 'abstract') {
      return res(
        ctx.status(200),
        ctx.json<IADSApiSearchResponse>({
          response: {
            numFound: 1,
            docs: [{ abstract: api.abstract() }],
          },
        }),
      );
    }

    // default search
    let limitAuthors = -1;
    if (typeof params.fl === 'string') {
      params.fl.split(',').forEach((v) => {
        const mat = /\[fields author=(\d+)]/.exec(v);
        if (mat !== null) {
          limitAuthors = parseInt(mat[1], 10);
        }
      });
    }

    const rows = parseInt(params.rows as string, 10) ?? 10;
    const numFound = faker.datatype.number({ min: 1, max: 10000 });

    const match = (params.q as string).includes('identifier:(')
      ? /identifier:\((.*?)\)/g.exec(params.q as string)
      : null;
    const ids = match ? match[1].split(' OR ') : [];

    const docs = map((i) => {
      const authorCount = ranRange(limitAuthors > 0 ? limitAuthors + 1 : 0, 1000);
      const citationCount = faker.datatype.number({ min: 0, max: 10000 });
      const referenceCount = faker.datatype.number({ min: 0, max: 10000 });
      const bibcode = ids.length > 0 ? ids.pop() : api.bibcode();
      return {
        bibcode,
        id: ids_mocks[i as number],
        author: map(api.author)(limitAuthors > 0 ? range(0, limitAuthors) : authorCount),
        author_count: authorCount.length,
        bibstem: map(api.bibstem)(ranRange(0, 10)),
        pubdate: api.pubdate(),
        title: [api.title()],
        esources: api.esources(),
        property: api.property(),
        citation_count: citationCount,
        citation_count_norm: Math.random(),
        '[citations]': {
          num_references: referenceCount,
          num_citations: citationCount,
        },
        orcid_pub: map(api.orcidPub)(limitAuthors > 0 ? range(0, limitAuthors) : authorCount),
        aff: map(api.aff)(limitAuthors > 0 ? range(0, limitAuthors) : authorCount),
        abstract: api.abstract(),
        identifier: [bibcode],
      };
    })(range(0, clamp(1, 100, rows)));

    const body: IADSApiSearchResponse = {
      response: {
        numFound,
        docs,
      },
      highlighting: highlights_mocks,
    };

    return res(ctx.status(200), ctx.json<IADSApiSearchResponse>(body));
  }),
];
