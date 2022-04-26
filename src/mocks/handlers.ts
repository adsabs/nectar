import { IADSApiGraphicsParams, IADSApiSearchResponse, IExportApiParams } from '@api';
import { ApiTargets } from '@api/lib/models';
import { Esources } from '@api/lib/search/types';
import faker from '@faker-js/faker';
import { IADSApiMetricsParams } from '@_api/metrics';
import { rest } from 'msw';
import qs from 'qs';
import { map, range, slice } from 'ramda';

export const handlers = [
  rest.get(`*${ApiTargets.BOOTSTRAP}`, (req, res, ctx) => {
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

  rest.post<IExportApiParams, { format: string }>(`*${ApiTargets.EXPORT}/:format`, (req, res, ctx) => {
    const { bibcode, ...body } = req.body;
    const { format } = req.params;

    return res(
      ctx.delay(500),
      ctx.status(200),
      ctx.json({
        export: `${JSON.stringify({ numRecords: bibcode.length, format, ...body }, null, 2)}`,
      }),
    );
  }),

  rest.get<IADSApiMetricsParams>(`*${ApiTargets.SERVICE_METRICS}/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        'skipped bibcodes': [],
        'basic stats': {
          'number of papers': 1,
          'normalized paper count': 1.0,
          'total number of reads': 20,
          'average number of reads': 20,
          'median number of reads': 20.0,
          'recent number of reads': 20,
          'total number of downloads': 0,
          'average number of downloads': 0.0,
          'median number of downloads': 0.0,
          'recent number of downloads': 0,
        },
        'basic stats refereed': {
          'number of papers': 0,
          'normalized paper count': 0.0,
          'total number of reads': 0,
          'average number of reads': 0,
          'median number of reads': 0.0,
          'recent number of reads': 0,
          'total number of downloads': 0,
          'average number of downloads': 0.0,
          'median number of downloads': 0.0,
          'recent number of downloads': 0,
        },
        'citation stats': {
          'number of citing papers': 0,
          'number of self-citations': 0,
          'self-citations': [],
          'total number of citations': 0,
          'average number of citations': 0.0,
          'median number of citations': 0.0,
          'normalized number of citations': 0.0,
          'total number of refereed citations': 0,
          'average number of refereed citations': 0.0,
          'median number of refereed citations': 0.0,
          'normalized number of refereed citations': 0.0,
        },
        'citation stats refereed': {
          'number of citing papers': 0,
          'number of self-citations': 0,
          'total number of citations': 0,
          'average number of citations': 0.0,
          'median number of citations': 0.0,
          'normalized number of citations': 0.0,
          'total number of refereed citations': 0,
          'average number of refereed citations': 0.0,
          'median number of refereed citations': 0.0,
          'normalized number of refereed citations': 0.0,
        },
        histograms: {
          reads: {
            'all reads': {
              '1996': 0,
              '1997': 0,
              '1998': 0,
              '1999': 0,
              '2000': 0,
              '2001': 0,
              '2002': 0,
              '2003': 0,
              '2004': 0,
              '2005': 0,
              '2006': 0,
              '2007': 0,
              '2008': 0,
              '2009': 0,
              '2010': 0,
              '2011': 0,
              '2012': 0,
              '2013': 0,
              '2014': 0,
              '2015': 0,
              '2016': 0,
              '2017': 0,
              '2018': 0,
              '2019': 0,
              '2020': 0,
              '2021': 0,
              '2022': 20,
            },
            'all reads normalized': {
              '1996': 0.0,
              '1997': 0.0,
              '1998': 0.0,
              '1999': 0.0,
              '2000': 0.0,
              '2001': 0.0,
              '2002': 0.0,
              '2003': 0.0,
              '2004': 0.0,
              '2005': 0.0,
              '2006': 0.0,
              '2007': 0.0,
              '2008': 0.0,
              '2009': 0.0,
              '2010': 0.0,
              '2011': 0.0,
              '2012': 0.0,
              '2013': 0.0,
              '2014': 0.0,
              '2015': 0.0,
              '2016': 0.0,
              '2017': 0.0,
              '2018': 0.0,
              '2019': 0.0,
              '2020': 0.0,
              '2021': 0.0,
              '2022': 20.0,
            },
            'refereed reads': {
              '1996': 0,
              '1997': 0,
              '1998': 0,
              '1999': 0,
              '2000': 0,
              '2001': 0,
              '2002': 0,
              '2003': 0,
              '2004': 0,
              '2005': 0,
              '2006': 0,
              '2007': 0,
              '2008': 0,
              '2009': 0,
              '2010': 0,
              '2011': 0,
              '2012': 0,
              '2013': 0,
              '2014': 0,
              '2015': 0,
              '2016': 0,
              '2017': 0,
              '2018': 0,
              '2019': 0,
              '2020': 0,
              '2021': 0,
              '2022': 0,
            },
            'refereed reads normalized': {
              '1996': 0,
              '1997': 0,
              '1998': 0,
              '1999': 0,
              '2000': 0,
              '2001': 0,
              '2002': 0,
              '2003': 0,
              '2004': 0,
              '2005': 0,
              '2006': 0,
              '2007': 0,
              '2008': 0,
              '2009': 0,
              '2010': 0,
              '2011': 0,
              '2012': 0,
              '2013': 0,
              '2014': 0,
              '2015': 0,
              '2016': 0,
              '2017': 0,
              '2018': 0,
              '2019': 0,
              '2020': 0,
              '2021': 0,
              '2022': 0,
            },
          },
          citations: {
            'refereed to refereed': { '2021': 0, '2022': 0 },
            'refereed to nonrefereed': { '2021': 0, '2022': 0 },
            'nonrefereed to refereed': { '2021': 0, '2022': 0 },
            'nonrefereed to nonrefereed': { '2021': 0, '2022': 0 },
            'refereed to refereed normalized': { '2021': 0, '2022': 0 },
            'refereed to nonrefereed normalized': { '2021': 0, '2022': 0 },
            'nonrefereed to refereed normalized': { '2021': 0, '2022': 0 },
            'nonrefereed to nonrefereed normalized': { '2021': 0, '2022': 0 },
          },
        },
      }),
    );
  }),

  rest.get<IADSApiGraphicsParams>(`*${ApiTargets.GRAPHICS}/:id`, (req, res, ctx) => {
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
