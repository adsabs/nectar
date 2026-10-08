import qs from 'qs';

import { AppMode, NumPerPageType } from '@/types';
import { SolrSortField } from '@/api/models';
import { IADSApiSearchParams } from '@/api/search/types';
import { SEARCH_API_KEYS, SearchNamespace } from '@/api/search/ui-tags';
import { searchQueryIdentity } from '@/api/search/searchQueryIdentity';
import { buildSearchParams } from '@/lib/buildSearchParams';
import { resolveAppMode } from '@/lib/resolveAppMode';
import { readAppModePref, readNumPerPagePref, readPreferredSearchSortPref } from '@/utils/common/prefs-cookie';

export interface SearchIdentityInputs {
  url: string;
  mode: AppMode;
  numPerPage: NumPerPageType;
  preferredSearchSort?: SolrSortField;
  numFound?: number;
}

export interface SearchIdentity {
  params: IADSApiSearchParams;
  searchParams: IADSApiSearchParams;
  queryKey: readonly [SearchNamespace, IADSApiSearchParams];
  queryHash: string;
}

export const searchIdentity = (inputs: SearchIdentityInputs): SearchIdentity => {
  const { params, searchParams } = buildSearchParams(inputs);
  const { queryKey, queryHash } = searchQueryIdentity(searchParams, SEARCH_API_KEYS.primary);

  return { params, searchParams, queryKey, queryHash };
};

type NextSearchParams = Record<string, string | string[] | undefined>;

const resolveServerMode = (searchParams: NextSearchParams, cookieHeader: string | undefined): AppMode =>
  resolveAppMode({
    forceModeParam: searchParams.forceMode,
    dParam: searchParams.d,
    allowDisciplineParam: true,
    cookieMode: readAppModePref(cookieHeader),
  }) ??
  // Matches the zustand initial value the client falls back to.
  AppMode.GENERAL;

const toUrl = (searchParams: NextSearchParams): string =>
  `/search?${qs.stringify(searchParams, { arrayFormat: 'repeat' })}`;

export const serverSearchIdentityInputs = ({
  searchParams,
  cookieHeader,
}: {
  searchParams: NextSearchParams;
  cookieHeader: string | undefined;
}): SearchIdentityInputs => ({
  url: toUrl(searchParams),
  mode: resolveServerMode(searchParams, cookieHeader),
  numPerPage: readNumPerPagePref(cookieHeader),
  preferredSearchSort: readPreferredSearchSortPref(cookieHeader),
});

export const clientSearchIdentityInputs = ({
  asPath,
  mode,
  numPerPage,
  preferredSearchSort,
  numFound,
}: {
  asPath: string;
  mode: AppMode;
  numPerPage: NumPerPageType;
  preferredSearchSort?: SolrSortField;
  numFound?: number;
}): SearchIdentityInputs => ({
  url: asPath.split('#')[0],
  mode,
  numPerPage,
  preferredSearchSort,
  numFound,
});
