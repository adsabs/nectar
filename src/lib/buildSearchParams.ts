import { omit } from 'ramda';

import { calculateStartIndex } from '@/lib/pagination';
import { APP_DEFAULTS } from '@/config';
import { AppMode, NumPerPageType } from '@/types';
import { defaultParams } from '@/api/search/models';
import { IADSApiSearchParams } from '@/api/search/types';
import { SolrSortField, solrDefaultSortDirection } from '@/api/models';
import { ADS_COMPAT_URL_PARAM } from '@/utils/common/search-mode-constants';
import { normalizeSolrSort, parseQueryFromUrl } from '@/utils/common/search';
import { applyBoostType } from '@/lib/applyBoostType';

export interface BuildSearchParamsOptions {
  url: string;
  mode: AppMode;
  numPerPage: NumPerPageType;
  preferredSearchSort?: SolrSortField;
  numFound?: number;
}

export interface BuiltSearchParams {
  params: IADSApiSearchParams;
  searchParams: IADSApiSearchParams;
}

const hasSortParam = (url: string): boolean => {
  const queryString = url.split('?')[1];
  if (!queryString) {
    return false;
  }
  return new URLSearchParams(queryString).has('sort');
};

export const buildSearchParams = (options: BuildSearchParamsOptions): BuiltSearchParams => {
  const { url, mode, numPerPage, preferredSearchSort = APP_DEFAULTS.PREFERRED_SEARCH_SORT, numFound } = options;

  const parsedParams = parseQueryFromUrl(url);
  const preferredSort = normalizeSolrSort([`${preferredSearchSort} ${solrDefaultSortDirection[preferredSearchSort]}`]);
  const sortWithDefault = hasSortParam(url) ? parsedParams.sort : preferredSort;

  const params = applyBoostType(
    {
      ...defaultParams,
      ...parsedParams,
      sort: sortWithDefault,
      rows: numPerPage,
      start: calculateStartIndex(parsedParams.p, numPerPage, numFound),
    },
    mode,
  );

  const searchParams = omit(['p', ADS_COMPAT_URL_PARAM, 'd', 'forceMode', 'notify'], params) as IADSApiSearchParams;

  return { params, searchParams };
};
