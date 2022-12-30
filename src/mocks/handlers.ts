import {
  ApiTargets,
  ExportApiFormatKey,
  IADSApiGraphicsParams,
  IADSApiMetricsParams,
  IADSApiReferenceResponse,
  IADSApiSearchResponse,
  IADSApiVaultResponse,
  IExportApiParams,
} from '@api';
import { IAuthorAffiliationItem, IAuthorAffiliationResponse } from '@api/author-affiliation/types';
import defaultBibstems from '@components/BibstemPicker/defaultBibstems.json';
import faker from '@faker-js/faker';
import { IBibstemOption } from '@types';
import { rest } from 'msw';
import qs from 'qs';
import { flatten, map, range } from 'ramda';
import { api, authorAffData, highlights_mocks, ids_mocks, ranRange } from './mockHelpers';

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

  rest.post(`*${ApiTargets.AUTHOR_AFFILIATION_SEARCH}`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json<IAuthorAffiliationResponse>({
      data: [
        ...flatten(range(0, 10).map(() => authorAffData(faker.datatype.number({ min: 1, max: 3 }))))
      ] 
    }));
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

    if (params.facet) {
      return res(
        ctx.status(200),
        ctx.json<IADSApiSearchResponse>({
          response: { docs: [], numFound: 1 },
          facet_counts: {
            facet_heatmaps: {},
            facet_intervals: {},
            facet_queries: {},
            facet_ranges: {},
            facet_fields: {
              author_facet: [],
              author_facet_hier: [],
              grant_facet_hier: [],
              nedtype_object_facet_hier: [],
              first_author_facet_hier: [
                '0/Kohler, S',
                520,
                '0/Wang, J',
                421,
                '0/Pickering, E',
                363,
                '0/Linsky, J',
                332,
                '0/Campbell, L',
                330,
                '0/Smith, M',
                312,
                '0/Adelman, S',
                300,
                '0/Lee, J',
                296,
                '0/Eggen, O',
                292,
                '0/Wang, Y',
                287,
              ],
              database: ['astronomy', 540774, 'physics', 84440, 'general', 17116],
              property: [
                'article',
                455590,
                'esource',
                440879,
                'openaccess',
                346131,
                'refereed',
                314205,
                'notrefereed',
                265972,
                'data',
                212892,
                'eprintopenaccess',
                168639,
                'pubopenaccess',
                158275,
                'adsopenaccess',
                153254,
                'nonarticle',
                124587,
              ],
              aff_facet_hier: [
                '0/Max Planck',
                26925,
                '0/INAF',
                22253,
                '0/CalTech',
                21882,
                '0/SI',
                19748,
                '0/Harvard U',
                19094,
                '0/CSIC Madrid',
                15137,
                '0/ESO',
                13802,
                '0/STScI',
                13352,
                '0/GSFC',
                12717,
                '0/U AZ',
                12178,
              ],
              keyword_facet: [
                'astrophysics',
                49222,
                'stars fundamental parameters',
                44275,
                'astronomy x rays',
                24971,
                'stars luminosity function;mass function',
                24863,
                'nuclear reactions;nucleosynthesis;abundances',
                19027,
                'stars variables',
                17904,
                'astronomy infrared',
                17711,
                'techniques photometric',
                16903,
                'techniques spectroscopic',
                16798,
                'methods numerical',
                16447,
              ],
              bibstem_facet: [
                'ApJ',
                55442,
                'MNRAS',
                43037,
                'A&A',
                41545,
                'AAS',
                31040,
                'arXiv',
                19289,
                'AJ',
                15857,
                'IAUS',
                14902,
                'ApJL',
                14329,
                'ASPC',
                13042,
                'PhDT',
                12119,
              ],
              bibgroup_facet: [
                'CfA',
                22660,
                'ESO/Telescopes',
                14917,
                'HST',
                14233,
                'NOIRLab',
                6962,
                'Chandra',
                6862,
                'NOAO',
                5555,
                'Keck',
                4812,
                'IUE',
                4300,
                'Leiden Observatory',
                4088,
                'XMM',
                3653,
              ],
              simbad_object_facet_hier: [
                '0/Star',
                118813,
                '0/Other',
                104053,
                '0/Galaxy',
                58491,
                '0/Nebula',
                13837,
                '0/HII Region',
                12623,
                '0/X-ray',
                5504,
                '0/Infrared',
                3532,
                '0/Radio',
                659,
                '0/UV',
                212,
              ],
              ned_object_facet_hier: [
                '0/Galaxy',
                34100,
                '0/Star',
                9290,
                '0/Other',
                6719,
                '0/Infrared',
                1177,
                '0/Radio',
                1114,
                '0/HII Region',
                1027,
                '0/UV',
                604,
                '0/Galactic Object',
                561,
                '0/Nebula',
                323,
              ],
              data_facet: [
                'SIMBAD',
                178016,
                'NED',
                39608,
                'MAST',
                33530,
                'CDS',
                29169,
                'IRSA',
                21737,
                'ESA',
                14236,
                'ESO',
                12950,
                'HEASARC',
                8712,
                'Chandra',
                6010,
                'XMM',
                3240,
              ],
              vizier_facet: [
                'Optical',
                11585,
                'Infrared',
                3800,
                'Stars',
                3408,
                'Photometry',
                2736,
                'Stars: variable',
                2622,
                'Photometry: wide-band',
                2485,
                'Galaxies',
                1938,
                'Velocities',
                1866,
                'Spectroscopy',
                1575,
                'Open Clusters',
                1535,
              ],
              doctype_facet_hier: ['0/Article', 448866, '0/Non-Article', 131320],
            },
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

    const value = { numRecords: bibcode.length, format, ...body };

    return res(
      ctx.delay(200),
      ctx.status(200),
      ctx.json({
        export: `${JSON.stringify(value, Object.keys(value).sort(), 2)}`,
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

  // simple search over top 100 terms
  rest.get<unknown, { term: string }>(`*/api/bibstems/:term`, (req, res, ctx) => {
    const term = req.params.term.toLowerCase();
    const values = defaultBibstems.filter(({ value, label }) => {
      const parts = `${value} ${Array.isArray(label) ? label[0] : label}`.toLowerCase().match(/\S+\s*/g);
      if (parts === null) {
        return false;
      }
      return parts.some((v) => v.startsWith(term));
    });
    return res(ctx.status(200), ctx.json<IBibstemOption[]>(values));
  }),
];
