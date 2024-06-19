import { expect, test } from 'vitest';
import { processLinkData } from '@/components/AbstractSources/linkGenerator';

test('processLinkData produces correct output', () => {
  expect(
    processLinkData(
      {
        bibcode: '2023MNRAS.518.3386T',
        esources: [
          'EPRINT_HTML',
          'EPRINT_PDF',
          'PUB_HTML',
          'PUB_PDF',
          'ADS_SCAN',
          'INSTITUTION',
          'ADS_PDF',
          'AUTHOR_HTML',
          'AUTHOR_PDF',
        ],
        property: ['ARTICLE', 'DATA', 'EPRINT_OPENACCESS', 'ESOURCE', 'OPENACCESS', 'REFEREED'],
        data: ['ESA:1', 'MAST:1', 'NED:21'],
      },
      'https://hollis.harvard.edu/openurl/01HVD/HVD_URL',
    ),
  ).toEqual({
    fullTextSources: [
      {
        url: '/link_gateway/2023MNRAS.518.3386T/ADS_PDF',
        open: false,
        shortName: 'ADS',
        name: 'ADS PDF',
        type: 'PDF',
        description: 'ADS PDF',
        rawType: 'ADS_PDF',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/ADS_SCAN',
        open: false,
        shortName: 'ADS',
        name: 'ADS Scanned Article',
        type: 'SCAN',
        description: 'ADS scanned article',
        rawType: 'ADS_SCAN',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/INSTITUTION',
        open: false,
        shortName: 'My Institution',
        name: 'My Institution',
        type: 'INSTITUTION',
        description: 'Find Article At My Institution',
        rawType: 'INSTITUTION',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/PUB_PDF',
        open: false,
        shortName: 'Publisher',
        name: 'Publisher PDF',
        type: 'PDF',
        description: 'Publisher PDF',
        rawType: 'PUB_PDF',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/PUB_HTML',
        open: false,
        shortName: 'Publisher',
        name: 'Publisher Article',
        type: 'HTML',
        description: 'Electronic on-line publisher article (HTML)',
        rawType: 'PUB_HTML',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/EPRINT_PDF',
        open: true,
        shortName: 'Preprint',
        name: 'Preprint PDF',
        type: 'PDF',
        description: 'Preprint PDF',
        rawType: 'EPRINT_PDF',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/EPRINT_HTML',
        open: true,
        shortName: 'Preprint',
        name: 'Preprint Article',
        type: 'HTML',
        description: 'Preprint article',
        rawType: 'EPRINT_HTML',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/AUTHOR_PDF',
        open: false,
        shortName: 'Author',
        name: 'Author PDF',
        type: 'PDF',
        description: 'Link to PDF page provided by author',
        rawType: 'AUTHOR_PDF',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/AUTHOR_HTML',
        open: false,
        shortName: 'Author',
        name: 'Author Article',
        type: 'HTML',
        description: 'Link to HTML page provided by author',
        rawType: 'AUTHOR_HTML',
      },
    ],
    dataProducts: [
      {
        url: '/link_gateway/2023MNRAS.518.3386T/NED',
        count: '21',
        name: 'NED',
        description: 'NASA/IPAC Extragalactic Database',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/ESA',
        count: '1',
        name: 'ESA',
        description: 'ESAC Science Data Center',
      },
      {
        url: '/link_gateway/2023MNRAS.518.3386T/MAST',
        count: '1',
        name: 'MAST',
        description: 'Mikulski Archive for Space Telescopes',
      },
    ],
  });
});

const defaultReturn: ReturnType<typeof processLinkData> = { fullTextSources: [], dataProducts: [] };

test('processLinkData can handle empty input', () => {
  expect(processLinkData(undefined, undefined)).toEqual(defaultReturn);
  expect(processLinkData(undefined, 'https://hollis.harvard.edu/openurl/01HVD/HVD_URL')).toEqual(defaultReturn);
  expect(processLinkData({}, 'https://hollis.harvard.edu/openurl/01HVD/HVD_URL')).toEqual(defaultReturn);
  expect(
    processLinkData({ bibcode: '2023MNRAS.518.3386T' }, 'https://hollis.harvard.edu/openurl/01HVD/HVD_URL'),
  ).toEqual(defaultReturn);
  expect(
    processLinkData(
      { bibcode: '2023MNRAS.518.3386T', esources: [] },
      'https://hollis.harvard.edu/openurl/01HVD/HVD_URL',
    ),
  ).toEqual(defaultReturn);
  expect(
    processLinkData(
      { bibcode: '2023MNRAS.518.3386T', esources: [], property: [] },
      'https://hollis.harvard.edu/openurl/01HVD/HVD_URL',
    ),
  ).toEqual(defaultReturn);
});
