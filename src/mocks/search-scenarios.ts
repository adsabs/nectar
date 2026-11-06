import { generateSearchResponse } from '@/mocks/generators/search';
import { IADSApiSearchResponse, IDocsEntity } from '@/api/search/types';

export const SEARCH_RESULTS_COUNT = 25;

const buildDoc = (index: number): IDocsEntity => {
  const label = String(index).padStart(2, '0');
  const padded = String(index).padStart(4, '0');
  const bibcode = `2024E2E..${padded}.${padded}E`;

  return {
    bibcode,
    title: [`E2E Result ${label}`],
    author: [`Author ${label}, A.`],
    author_count: 1,
    pubdate: '2024-01-00',
    bibstem: ['E2E'],
    citation_count: index,
    citation_count_norm: 0,
    credit: [],
    doi: [`10.0000/e2e.${label}`],
    esources: [],
    page: padded,
    property: [],
    pub: 'E2E Journal',
    reference_count: 0,
    data: [],
    id: String(index),
    identifier: [bibcode],
    volume: padded,
  };
};

export const searchResultsFixture: IADSApiSearchResponse = generateSearchResponse({
  numFound: SEARCH_RESULTS_COUNT,
  innerResponse: {
    docs: Array.from({ length: SEARCH_RESULTS_COUNT }, (_, i) => buildDoc(i + 1)),
  },
});

export const searchEmptyFixture: IADSApiSearchResponse = generateSearchResponse({
  numFound: 0,
  innerResponse: { docs: [] },
});
