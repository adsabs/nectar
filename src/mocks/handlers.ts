import {
  ApiTargets,
  Esources,
  ExportApiFormatKey,
  IADSApiGraphicsParams,
  IADSApiMetricsParams,
  IADSApiReferenceResponse,
  IADSApiSearchResponse,
  IADSApiVaultResponse,
  IExportApiParams,
} from '@api';
import faker from '@faker-js/faker';
import { rest } from 'msw';
import qs from 'qs';
import { map, range, slice } from 'ramda';

faker.seed(143);

export const handlers = [
  rest.get(`*${ApiTargets.BOOTSTRAP}`, (req, res, ctx) => {
    const test = req.url.searchParams.get('test');

    if (test === 'networkerror') {
      return res.networkError('failure');
    } else if (test === 'fail') {
      return res(ctx.status(500, 'Server Error'));
    }

    return res(
      ctx.status(200),
      ctx.cookie('session', 'test-session'),
      ctx.json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
        access_token: '------ mocked token ---------',
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

  rest.get(`*${ApiTargets.SEARCH}`, (req, res, ctx) => {
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
            }))(range(0, rows)),
          },
        }),
      );
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
        const mat = /\[fields author=(\d+)\]/.exec(v);
        if (mat !== null) {
          limitAuthors = parseInt(mat[1], 10);
        }
      });
    }

    const rows = parseInt(params.rows as string, 10) ?? 10;
    const numFound = faker.datatype.number({ min: 1, max: 10000 });
    const docs = map((i) => {
      const authorCount = ranRange(limitAuthors > 0 ? limitAuthors + 1 : 0, 1000);
      const citationCount = faker.datatype.number({ min: 0, max: 10000 });
      const referenceCount = faker.datatype.number({ min: 0, max: 10000 });
      return {
        bibcode: api.bibcode(),
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
      };
    })(range(0, rows));

    const body: IADSApiSearchResponse = {
      response: {
        numFound,
        docs,
      },
      highlighting: highlights_mocks,
    };

    return res(ctx.status(200), ctx.json<IADSApiSearchResponse>(body));
  }),

  rest.post<IExportApiParams, { format: ExportApiFormatKey }>(`*${ApiTargets.EXPORT}/:format`, (req, res, ctx) => {
    const { bibcode, ...body } = req.body;
    const { format } = req.params;

    return res(
      ctx.delay(200),
      ctx.status(200),
      ctx.json({
        export: `${JSON.stringify({ numRecords: bibcode.length, format, ...body }, null, 2)}`,
      }),
    );
  }),

  rest.post<IADSApiMetricsParams>(`*${ApiTargets.SERVICE_METRICS}`, async (req, res, ctx) => {
    return res(
      ctx.status(200),

      ctx.json(await import('./responses/metrics.json')),
    );
  }),

  rest.get<IADSApiGraphicsParams>(`${ApiTargets.GRAPHICS}/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        bibcode: '2018A&A...616A...1G',
        number: 7,
        pick: '<a href="graphics" border=0><img src="[\'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig2.jpg\', \'http://dx.doi.org/10.1051/0004-6361/201833051\']"></a>',
        figures: [
          {
            figure_label: 'Figure 1',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig1.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 2',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig2.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 3',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig3.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 4',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig4.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 5',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig5.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 6',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig6.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
          {
            figure_label: 'Figure 7',
            figure_caption: '',
            figure_type: '',
            images: [
              {
                thumbnail: 'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig7.jpg',
                highres: 'http://dx.doi.org/10.1051/0004-6361/201833051',
              },
            ],
          },
        ],
        header:
          'Every image links to the article on <a href="http://www.aanda.org/" target="_new">Astronomy &amp; Astrophysics</a>',
      }),
    );
  }),

  rest.get<unknown, { text: string }>(`*${ApiTargets.REFERENCE}/:text`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<IADSApiReferenceResponse>({
        resolved: {
          refstring: req.params.text,
          score: '1.0',
          bibcode: '2000A&A...362..333S',
        },
      }),
    );
  }),

  rest.post(`*${ApiTargets.MYADS_STORAGE}/query`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<IADSApiVaultResponse>({
        qid: '012345690',
        numfound: 10,
      }),
    );
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

const ids_mocks = range(0, 10).map(() => faker.random.alphaNumeric(8));

const highlights_mocks: IADSApiSearchResponse['highlighting'] = {
  [ids_mocks[0]]: {
    abstract: [
      'The wit makes fun of other persons; the <em>satirist</em> makes fun of the world; the humorist makes fun of himself.',
      'Everything is funny as long as it is happening to <em>Somebody</em> Else.',
    ],
    title: ["In everyone's <em>heart</em> stirs a great homesickness."],
  },
  [ids_mocks[1]]: {},
  [ids_mocks[2]]: {
    abstract: [
      'The wit makes fun of other persons; the <em>satirist</em> makes fun of the world; the humorist makes fun of himself.',
    ],
    title: ["In everyone's <em>heart</em> stirs a great homesickness."],
  },
  [ids_mocks[3]]: {
    abstract: [
      'The wit makes fun of other persons; the <em>satirist</em> makes fun of the world; the humorist makes fun of himself.',
    ],
  },
  [ids_mocks[4]]: {
    title: ["In everyone's <em>heart</em> stirs a great homesickness."],
  },
  [ids_mocks[5]]: {},
  [ids_mocks[6]]: {},
  [ids_mocks[7]]: {},
  [ids_mocks[8]]: {},
  [ids_mocks[9]]: {},
};
