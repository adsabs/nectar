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
    q: query.q === '*:*' ? `pub:"${facetKey}"` : `${query.q} pub:"${facetKey}"`,
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

export const makeBibgroupSearchLink = (query: IADSApiSearchParams, facetKey: string) => {
  const params = makeSearchParams({
    ...query,
    q: query.q === '*:*' ? `bibgroup:"${facetKey}"` : `${query.q} bibgroup:"${facetKey}"`,
  });
  return `/search?${params}`;
};

export const makeDataGroupSearchLink = (query: IADSApiSearchParams, facetKey: string) => {
  const params = makeSearchParams({
    ...query,
    q: query.q === '*:*' ? `data:"${facetKey}"` : `${query.q} data:"${facetKey}"`,
  });
  return `/search?${params}`;
};

export const makeYearSearchLink = (query: IADSApiSearchParams, year: string) => {
  const params = makeSearchParams({
    ...query,
    q: query.q === '*:*' ? `year:"${year}"` : `${query.q} year:"${year}"`,
  });
  return `/search?${params}`;
};
