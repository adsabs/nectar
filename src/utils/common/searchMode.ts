import type { IADSApiSearchParams } from '@/api/search/types';
import { applyFiltersToQuery } from '@/components/SearchFacet/helpers';
import { omit } from 'ramda';
import type { SolrSort } from '@/api/models';
import {
  ADS_COMPAT_FQ_DATABASE,
  ADS_COMPAT_FQ_ENTRY,
  ADS_COMPAT_SORT,
  ADS_COMPAT_URL_PARAM,
  SearchMode,
} from '@/utils/common/search-mode-constants';

// Here for existing call sites. Import from search-mode-constants directly
// if that's all you need — this file also pulls in the lucene parser.
export {
  SearchMode,
  SEARCH_MODE_OPTIONS,
  ADS_COMPAT_SORT,
  ADS_COMPAT_FQ_ENTRY,
  ADS_COMPAT_FQ_DATABASE,
  ADS_COMPAT_URL_PARAM,
} from '@/utils/common/search-mode-constants';

export const buildSearchOutgoing = (query: IADSApiSearchParams, mode: string): IADSApiSearchParams => {
  const withDefaults = applySearchModeDefaults(query, mode);
  return mode === SearchMode.ADS_COMPAT
    ? ({ ...withDefaults, [ADS_COMPAT_URL_PARAM]: '1' } as IADSApiSearchParams)
    : withDefaults;
};

// Sort-change variant of buildSearchOutgoing: keeps ads_compat/fq handling in
// sync with the current mode, but re-asserts the explicitly chosen sort so the
// ADS_COMPAT default sort never clobbers a deliberate selection.
export const buildSortChangeOutgoing = (
  query: IADSApiSearchParams,
  mode: string,
  sort: SolrSort[],
): IADSApiSearchParams => ({ ...buildSearchOutgoing({ ...query, sort }, mode), sort });

export const applySearchModeDefaults = (query: IADSApiSearchParams, mode: string | undefined): IADSApiSearchParams => {
  if (mode === SearchMode.ADS_COMPAT) {
    const withCollections = applyFiltersToQuery({
      query,
      values: ['astronomy', 'physics'],
      field: 'database',
      logic: 'or',
    }) as IADSApiSearchParams;
    return { ...withCollections, sort: ADS_COMPAT_SORT };
  }

  // Strip ADS-implied filters/sort if present and exactly matching ADS defaults.
  // Only strip the exact values we would have set — leave user-configured values alone.
  if (query.fq_database === ADS_COMPAT_FQ_DATABASE) {
    const fqWithout = (query.fq as string[] | undefined)?.filter((f) => f !== ADS_COMPAT_FQ_ENTRY) ?? [];
    const withoutDb = omit(['fq_database'], query) as IADSApiSearchParams;
    const withoutFq =
      fqWithout.length > 0 ? { ...withoutDb, fq: fqWithout } : (omit(['fq'], withoutDb) as IADSApiSearchParams);
    // Also revert sort if it exactly matches the ADS default.
    const currentSort = withoutFq.sort as SolrSort[] | undefined;
    const sortIsAdsDefault =
      currentSort?.length === ADS_COMPAT_SORT.length && currentSort.every((s, i) => s === ADS_COMPAT_SORT[i]);
    return sortIsAdsDefault ? (omit(['sort'], withoutFq) as IADSApiSearchParams) : withoutFq;
  }

  return query;
};
