import { IADSApiSearchResponse } from '@api';
import { ApiTargets } from '@api/lib/models';
import { Esources } from '@api/lib/search/types';
import faker from '@faker-js/faker';
import { rest } from 'msw';
import qs from 'qs';
import { map, range, slice } from 'ramda';

const baseUrl = 'https://devapi.adsabs.harvard.edu/v1';

export const handlers = [
  rest.get(`${baseUrl}${ApiTargets.BOOTSTRAP}`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.cookie('session', 'test-session'),
      ctx.json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
        access_token: 'yDCIgkpQjCrNWUqTfVbrrmBYImY6bJHWlHON45eq',
        client_name: 'BB client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'ly8MkAN34LBNDwco3Ptl4tPMFuNzsEzMXGS8KYMneokpZsSYrVgSrs1lJJx7',
        expire_in: '2099-03-22T14:50:07.712037',
        refresh_token: 'BENF2Gu2EXDXreAjzkiDoV7ReXaNisy4j9kn088u',
      }),
    );
  }),

  rest.get(`${baseUrl}${ApiTargets.SEARCH}`, (req, res, ctx) => {
    const params = qs.parse(req.url.search.slice(1));

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
    if (Array.isArray(params.fl)) {
      params.fl.forEach((v) => {
        const mat = /\[fields author=(\d+)\]/.exec(v as string);
        if (mat !== null) {
          limitAuthors = parseInt(mat[1], 10);
        }
      });
    }

    const rows = parseInt(params.rows as string, 10) ?? 10;
    const numFound = faker.datatype.number({ min: 1, max: 10000 });
    const body: IADSApiSearchResponse = {
      response: {
        numFound,
        docs: map(() => {
          const authorCount = ranRange(limitAuthors > 0 ? limitAuthors + 1 : 0, 1000);
          const citationCount = faker.datatype.number({ min: 0, max: 10000 });
          const referenceCount = faker.datatype.number({ min: 0, max: 10000 });
          return {
            bibcode: api.bibcode(),
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
          };
        })(range(0, rows)),
      },
    };

    return res(ctx.status(200), ctx.json<IADSApiSearchResponse>(body));
  }),
];

// fake api data generators
const api = {
  bibcode: () => faker.random.alphaNumeric(18),
  author: () => `${faker.name.lastName()}, ${faker.name.lastName()}`,
  bibstem: () => faker.random.alphaNumeric(6),
  pubdate: () => {
    const date = faker.date.between('2000', '2020');
    return `${date.getFullYear()}-${date.getMonth()}-00`;
  },
  title: () => faker.lorem.sentence(10, 40),
  esources: (): Esources[] => {
    const keys = Object.keys(Esources);
    const max = faker.datatype.number(keys.length);
    return slice(faker.datatype.number({ min: 0, max }), max, keys as Esources[]);
  },
  property: () => ['ARTICLE', 'ESOURCE', 'REFEREED'],
  orcidPub: () => (faker.datatype.boolean() ? `0000-0000-0000-0000` : '-'),
  aff: () =>
    `${faker.company.companyName()}, ${faker.address.zipCode()}, ${faker.address.city()}, ${faker.address.country()}`,
  abstract: () => faker.lorem.paragraphs(faker.datatype.number({ min: 1, max: 5 })),
};

// create random sized array of number
const ranRange = (min: number, max: number) => {
  return range(min, faker.datatype.number({ min, max }));
};
