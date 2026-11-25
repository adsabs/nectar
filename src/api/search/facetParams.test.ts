import { describe, expect, test } from 'vitest';
import {
  getSearchFacetCitationsParams,
  getSearchFacetJSONParams,
  getSearchFacetParams,
  getSearchFacetReadsParams,
  getSearchFacetYearsParams,
  getSearchStatsParams,
} from './models';
import { IADSApiSearchParams } from './types';

const pageQuery: IADSApiSearchParams = {
  q: 'star',
  sort: ['score desc'],
  start: 20,
  rows: 500,
};

const builders: [string, (params: IADSApiSearchParams) => IADSApiSearchParams][] = [
  ['getSearchFacetParams', getSearchFacetParams],
  ['getSearchFacetJSONParams', getSearchFacetJSONParams],
  ['getSearchFacetYearsParams', getSearchFacetYearsParams],
  ['getSearchFacetCitationsParams', getSearchFacetCitationsParams],
  ['getSearchFacetReadsParams', getSearchFacetReadsParams],
  ['getSearchStatsParams', (params) => getSearchStatsParams(params, 'citation_count desc')],
];

describe('facet and stats requests ask for no documents (criterion 6a)', () => {
  test.each(builders)('%s requests zero rows', (_name, build) => {
    const params = build(pageQuery);

    expect(params.rows).toBe(0);
  });

  test.each(builders)('%s still carries the query it was given', (_name, build) => {
    const params = build(pageQuery);

    expect(params.q).toBe('star');
    expect(params.fl).toEqual(['id']);
  });

  test('a page-sized rows value never survives into a facet request', () => {
    for (const [, build] of builders) {
      expect(build(pageQuery).rows).not.toBe(500);
    }
  });
});
