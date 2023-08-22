/* eslint-disable */
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
import { IAuthorAffiliationExportPayload, IAuthorAffiliationResponse } from '@api/author-affiliation/types';
import defaultBibstems from '@components/BibstemPicker/defaultBibstems.json';
import faker from '@faker-js/faker';
import { IBibstemOption } from '@types';
import { rest } from 'msw';
import qs from 'qs';
import { clamp, flatten, map, range } from 'ramda';
import { api, authorAffData, highlights_mocks, ids_mocks, ranRange } from './mockHelpers';
import { orcidHandlers } from '@mocks/handlers/orcid';
import { passthroughs } from '@mocks/handlers/passthroughs';
import { userHandlers } from '@mocks/responses/user/user';

export const handlers = [
  ...userHandlers,
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
    return res(
      ctx.status(200),
      ctx.json<IAuthorAffiliationResponse>({
        data: [...flatten(range(0, 10).map(() => authorAffData(faker.datatype.number({ min: 1, max: 3 }))))],
      }),
    );
  }),

  rest.post<IAuthorAffiliationExportPayload>(`*${ApiTargets.AUTHOR_AFFILIATION_EXPORT}`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json('success'));
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
            }))(range(0, clamp(1, 100, rows))),
          },
        }),
      );
    }

    if (params['json.facet']) {
      if (
        (
          JSON.parse(params['json.facet'] as string) as {
            author_facet_hier: {
              prefix: string;
            };
          }
        )?.author_facet_hier?.prefix?.startsWith('1')
      ) {
        return res(
          ctx.status(200),
          ctx.json<IADSApiSearchResponse>({
            response: { docs: [], numFound: 1 },
            facets: {
              author_facet_heir: {
                numBuckets: 999,
                buckets: [
                  {
                    val: '1/Wang, Y/Wang, Y',
                    count: 603,
                  },
                  {
                    val: '1/Wang, Y/Wang, Yan',
                    count: 283,
                  },
                  {
                    val: '1/Wang, Y/Wang, Yu',
                    count: 274,
                  },
                  {
                    val: '1/Wang, Y/Wang, Yi',
                    count: 231,
                  },
                  {
                    val: '1/Wang, Y/Wang, Yang',
                    count: 228,
                  },
                  {
                    val: '1/Wang, Y/Wang, Yong',
                    count: 188,
                  },
                  {
                    val: '1/Wang, Y/Wang, Ying',
                    count: 144,
                  },
                  {
                    val: '1/Wang, Y/Wang, Yue',
                    count: 124,
                  },
                  {
                    val: '1/Wang, Y/Wang, Y  F',
                    count: 117,
                  },
                  {
                    val: '1/Wang, Y/Wang, Yun',
                    count: 107,
                  },
                ],
              },
            },
          }),
        );
      }
      return res(
        ctx.status(200),
        ctx.json<IADSApiSearchResponse>({
          response: { docs: [], numFound: 1 },
          facets: {
            database: {
              numBuckets: 3,
              buckets: [
                {
                  val: 'physics',
                  count: 766836,
                },
                {
                  val: 'astronomy',
                  count: 144621,
                },
                {
                  val: 'general',
                  count: 144156,
                },
              ],
            },
            author_facet_hier: {
              numBuckets: 939072,
              buckets: [
                {
                  val: '0/Wang, Y',
                  count: 7088,
                },
                {
                  val: '0/Zhang, Y',
                  count: 6351,
                },
                {
                  val: '0/Wang, J',
                  count: 5766,
                },
                {
                  val: '0/Li, Y',
                  count: 5566,
                },
                {
                  val: '0/Liu, Y',
                  count: 5394,
                },
                {
                  val: '0/Wang, X',
                  count: 5327,
                },
                {
                  val: '0/Li, J',
                  count: 4861,
                },
                {
                  val: '0/Zhang, J',
                  count: 4797,
                },
                {
                  val: '0/Li, X',
                  count: 4771,
                },
                {
                  val: '0/Zhang, X',
                  count: 4704,
                },
              ],
            },
            property: {
              numBuckets: 19,
              buckets: [
                {
                  val: 'esource',
                  count: 812635,
                },
                {
                  val: 'article',
                  count: 790169,
                },
                {
                  val: 'refereed',
                  count: 509682,
                },
                {
                  val: 'notrefereed',
                  count: 472391,
                },
                {
                  val: 'openaccess',
                  count: 304280,
                },
                {
                  val: 'nonarticle',
                  count: 191904,
                },
                {
                  val: 'pubopenaccess',
                  count: 164685,
                },
                {
                  val: 'eprintopenaccess',
                  count: 150900,
                },
                {
                  val: 'toc',
                  count: 129379,
                },
                {
                  val: 'data',
                  count: 24789,
                },
              ],
            },
            keyword_facet: {
              numBuckets: 1950,
              buckets: [
                {
                  val: 'methods numerical',
                  count: 74533,
                },
                {
                  val: 'thermodynamics',
                  count: 20648,
                },
                {
                  val: 'hydrodynamics',
                  count: 20042,
                },
                {
                  val: 'methods data analysis',
                  count: 17501,
                },
                {
                  val: 'atmosphere',
                  count: 12626,
                },
                {
                  val: 'astrochemistry',
                  count: 12505,
                },
                {
                  val: 'site testing',
                  count: 11987,
                },
                {
                  val: 'electrodynamics',
                  count: 10484,
                },
                {
                  val: 'methods analytical',
                  count: 10236,
                },
                {
                  val: 'astrophysics',
                  count: 10164,
                },
              ],
            },
            aff_facet_hier: {
              numBuckets: 4392,
              buckets: [
                {
                  val: '0/CalTech',
                  count: 12691,
                },
                {
                  val: '0/Helmholtz Res Ctrs',
                  count: 11853,
                },
                {
                  val: '0/Max Planck',
                  count: 11064,
                },
                {
                  val: '0/CAS Beijing',
                  count: 8688,
                },
                {
                  val: '0/INFN',
                  count: 8155,
                },
                {
                  val: '0/UCB',
                  count: 7805,
                },
                {
                  val: '0/MIT',
                  count: 7773,
                },
                {
                  val: '0/Stanford U',
                  count: 7367,
                },
                {
                  val: '0/GSFC',
                  count: 7322,
                },
                {
                  val: '0/Harvard U',
                  count: 7135,
                },
              ],
            },
            bibgroup_facet: {
              numBuckets: 29,
              buckets: [
                {
                  val: 'PhysEd',
                  count: 7070,
                },
                {
                  val: 'CfA',
                  count: 4117,
                },
                {
                  val: 'ESO/Telescopes',
                  count: 1549,
                },
                {
                  val: 'HST',
                  count: 1536,
                },
                {
                  val: 'Chandra',
                  count: 978,
                },
                {
                  val: 'NOIRLab',
                  count: 827,
                },
                {
                  val: 'NOAO',
                  count: 702,
                },
                {
                  val: 'Leiden Observatory',
                  count: 578,
                },
                {
                  val: 'XMM',
                  count: 553,
                },
                {
                  val: 'Keck',
                  count: 528,
                },
              ],
            },
            bibstem_facet: {
              numBuckets: 16235,
              buckets: [
                {
                  val: 'arXiv',
                  count: 85421,
                },
                {
                  val: 'SPIE',
                  count: 74368,
                },
                {
                  val: 'AIPC',
                  count: 29337,
                },
                {
                  val: 'EGUGA',
                  count: 28693,
                },
                {
                  val: 'PhDT',
                  count: 27825,
                },
                {
                  val: 'JPhCS',
                  count: 25918,
                },
                {
                  val: 'NatSR',
                  count: 21087,
                },
                {
                  val: 'MS&E',
                  count: 18308,
                },
                {
                  val: 'E&ES',
                  count: 14189,
                },
                {
                  val: 'STIN',
                  count: 11419,
                },
              ],
            },
            vizier_facet: {
              numBuckets: 85,
              buckets: [
                {
                  val: 'Optical',
                  count: 733,
                },
                {
                  val: 'Galaxies',
                  count: 205,
                },
                {
                  val: 'Infrared',
                  count: 182,
                },
                {
                  val: 'Stars',
                  count: 179,
                },
                {
                  val: 'Photometry',
                  count: 161,
                },
                {
                  val: 'Redshifts',
                  count: 129,
                },
                {
                  val: 'Photometry: wide-band',
                  count: 125,
                },
                {
                  val: 'Spectroscopy',
                  count: 122,
                },
                {
                  val: 'Stars: variable',
                  count: 109,
                },
                {
                  val: 'Radio',
                  count: 108,
                },
              ],
            },
            doctype_facet_hier: {
              numBuckets: 2,
              buckets: [
                {
                  val: '0/Article',
                  count: 785675,
                },
                {
                  val: '0/Non-Article',
                  count: 196401,
                },
              ],
            },
            data_facet: {
              numBuckets: 69,
              buckets: [
                {
                  val: 'SIMBAD',
                  count: 16870,
                },
                {
                  val: 'MAST',
                  count: 5680,
                },
                {
                  val: 'NED',
                  count: 5430,
                },
                {
                  val: 'CDS',
                  count: 2427,
                },
                {
                  val: 'IRSA',
                  count: 2066,
                },
                {
                  val: 'ESA',
                  count: 1541,
                },
                {
                  val: 'ESO',
                  count: 1400,
                },
                {
                  val: 'Chandra',
                  count: 1271,
                },
                {
                  val: 'HEASARC',
                  count: 925,
                },
                {
                  val: 'Spitzer',
                  count: 512,
                },
              ],
            },
          },
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
        pick: '<a href="/graphics" border=0><img alt="alt" src="[\'https://s3.amazonaws.com/adsabs-thumbnails/seri/A%2BA/0616/aa33051-18/aa33051-18-fig2.jpg\', \'http://dx.doi.org/10.1051/0004-6361/201833051\']"></a>',
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
  ...orcidHandlers,
  ...passthroughs,
];
