import { describe, expect, test } from 'vitest';
import { processLinkData } from '@/components/AbstractSources/linkGenerator';
import { Esources } from '@/api/search/types';

const shuffle = <T>(arr: Array<T>) => arr.sort(() => Math.random() - 0.5);

describe('processLinkData', () => {
  test.concurrent.each<[string, Parameters<typeof processLinkData>, ReturnType<typeof processLinkData>]>([
    ['empty', [{}, ''], { fullTextSources: [], dataProducts: [] }],
    [
      'full-text-sources',
      [{ esources: ['EPRINT_HTML', 'EPRINT_PDF', 'PUB_HTML'] }],
      {
        fullTextSources: [
          {
            description: 'Electronic on-line publisher article (HTML)',
            name: 'Publisher Article',
            open: false,
            rawType: 'PUB_HTML',
            shortName: 'Publisher',
            type: 'HTML',
            url: '',
          },
          {
            description: 'Preprint PDF',
            name: 'Preprint PDF',
            open: false,
            rawType: 'EPRINT_PDF',
            shortName: 'Preprint',
            type: 'PDF',
            url: '',
          },
          {
            description: 'Preprint article',
            name: 'Preprint Article',
            open: false,
            rawType: 'EPRINT_HTML',
            shortName: 'Preprint',
            type: 'HTML',
            url: '',
          },
        ],
        dataProducts: [],
      },
    ],
    [
      'data-products',
      [{ data: ['NED:3939', 'SIMBAD:1', 'ESO:1'] }],
      {
        fullTextSources: [],
        dataProducts: [
          {
            count: '3939',
            description: 'NASA/IPAC Extragalactic Database',
            name: 'NED',
            url: '',
          },
          {
            count: '1',
            description: 'SIMBAD Database at the CDS',
            name: 'SIMBAD',
            url: '',
          },
          {
            count: '1',
            description: 'European Southern Observatory',
            name: 'ESO',
            url: '',
          },
        ],
      },
    ],
    ['handles missing data', [{ data: null, esources: null }], { fullTextSources: [], dataProducts: [] }],
    [
      'handles unknown entry',
      [{ data: ['FOO:1'], esources: ['BAZ' as keyof typeof Esources] }],
      {
        fullTextSources: [
          {
            description: 'BAZ',
            name: 'BAZ',
            url: '',
            open: false,
            shortName: 'BAZ',
            type: 'HTML',
            rawType: 'BAZ' as keyof typeof Esources,
          },
        ],
        dataProducts: [
          {
            count: '1',
            description: 'FOO',
            name: 'FOO',
            url: '',
          },
        ],
      },
    ],
    [
      'My Institution links are created',
      [{ esources: [], doi: ['foo'] }, 'http://my-link-server.com/'],
      {
        fullTextSources: [
          {
            description: 'Find Article At My Institution',
            name: 'My Institution',
            openUrl: true,
            rawType: 'INSTITUTION',
            shortName: 'My Institution',
            type: 'INSTITUTION',
            url: 'http://my-link-server.com/?url_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:article&rfr_id=info:sid/ADS&sid=ADS&id=doi:foo&genre=article&rft_id=info:doi/foo&rft.degree=false&rft.genre=article',
          },
        ],
        dataProducts: [],
      },
    ],
    [
      'sorting is correct',
      [
        {
          // initially shuffle these to ensure that we don't infer any ordering
          esources: shuffle([
            'AUTHOR_HTML',
            'AUTHOR_PDF',
            'EPRINT_HTML',
            'EPRINT_PDF',
            'PUB_HTML',
            'PUB_PDF',
            'ADS_PDF',
            'ADS_SCAN',
            'FOO' as keyof typeof Esources,
          ]),
          doi: ['foo'],
          bibcode: 'test',
          property: ['EPRINT_OPENACCESS'],
        },
        'http://my-link-server.com/',
      ],
      {
        fullTextSources: [
          {
            description: 'ADS PDF',
            name: 'ADS PDF',
            open: false,
            rawType: 'ADS_PDF',
            shortName: 'ADS',
            type: 'PDF',
            url: '/link_gateway/test/ADS_PDF',
          },
          {
            description: 'ADS scanned article',
            name: 'ADS Scanned Article',
            open: false,
            rawType: 'ADS_SCAN',
            shortName: 'ADS',
            type: 'SCAN',
            url: '/link_gateway/test/ADS_SCAN',
          },
          {
            description: 'Find Article At My Institution',
            name: 'My Institution',
            openUrl: true,
            rawType: 'INSTITUTION',
            shortName: 'My Institution',
            type: 'INSTITUTION',
            url: 'http://my-link-server.com/?url_ver=Z39.88-2004&rft_val_fmt=info:ofi/fmt:kev:mtx:article&rfr_id=info:sid/ADS&sid=ADS&id=doi:foo&genre=article&rft_id=info:doi/foo&rft_id=info:bibcode/test&rft.genre=article',
          },
          {
            description: 'Publisher PDF',
            name: 'Publisher PDF',
            open: false,
            rawType: 'PUB_PDF',
            shortName: 'Publisher',
            type: 'PDF',
            url: '/link_gateway/test/PUB_PDF',
          },
          {
            description: 'Electronic on-line publisher article (HTML)',
            name: 'Publisher Article',
            open: false,
            rawType: 'PUB_HTML',
            shortName: 'Publisher',
            type: 'HTML',
            url: '/link_gateway/test/PUB_HTML',
          },
          {
            description: 'Preprint PDF',
            name: 'Preprint PDF',
            open: true,
            rawType: 'EPRINT_PDF',
            shortName: 'Preprint',
            type: 'PDF',
            url: '/link_gateway/test/EPRINT_PDF',
          },
          {
            description: 'Preprint article',
            name: 'Preprint Article',
            open: true,
            rawType: 'EPRINT_HTML',
            shortName: 'Preprint',
            type: 'HTML',
            url: '/link_gateway/test/EPRINT_HTML',
          },
          {
            description: 'Link to PDF page provided by author',
            name: 'Author PDF',
            open: false,
            rawType: 'AUTHOR_PDF',
            shortName: 'Author',
            type: 'PDF',
            url: '/link_gateway/test/AUTHOR_PDF',
          },
          {
            description: 'Link to HTML page provided by author',
            name: 'Author Article',
            open: false,
            rawType: 'AUTHOR_HTML',
            shortName: 'Author',
            type: 'HTML',
            url: '/link_gateway/test/AUTHOR_HTML',
          },
          {
            description: 'FOO',
            name: 'FOO',
            open: false,
            rawType: 'FOO' as keyof typeof Esources,
            shortName: 'FOO',
            type: 'HTML',
            url: '/link_gateway/test/FOO',
          },
        ],
        dataProducts: [],
      },
    ],
  ])('%s', async (_, args, expected) => {
    expect(processLinkData(...args)).toEqual(expected);
    return Promise.resolve();
  });
});
