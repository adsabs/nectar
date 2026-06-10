import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';
import { IUseGetFacetDataProps } from '../SearchFacet/useGetFacetData';
import { makeSearchParams } from '@/utils/common/search';

export const allRecordsQuery: IADSApiSearchParams = {
  q: '*:*',
  sort: APP_DEFAULTS.SORT,
  rows: 0,
};

export const searchFacetDefaultParams: IUseGetFacetDataProps & { offset: number; limit?: number } = {
  field: 'database',
  prefix: '',
  query: '',
  level: 'root',
  sortField: 'count',
  sortDir: 'desc',
  offset: 0,
  limit: 500,
};

export const makeJournalSearchLink = (query: IADSApiSearchParams, facetKey: string) => {
  const params = makeSearchParams({
    ...query,
    q: `${query.q} pub:"${facetKey}"`,
  });
  return `/search?${params}`;
};

// const makeJournalSearchLink = (facetKey: string) => {
//   const newQuery = applyFiltersToQuery({
//     q: query,
//     field: 'pub',
//     logic: 'or',
//     values: [facetKey],
//   });
//   return `/search?${makeSearchParams(newQuery)}`;
// };
