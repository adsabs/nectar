import type { IADSApiSearchParams } from '@/api/search/types';
import { applyFiltersToQuery } from '@/components/SearchFacet/helpers';
import { omit } from 'ramda';
import type { SolrSort } from '@/api/models';

export enum SearchMode {
  ALL_RELEVANT = 'ALL_RELEVANT',
  ADS_COMPAT = 'ADS_COMPAT',
}

export const SEARCH_MODE_OPTIONS = [
  {
    mode: SearchMode.ALL_RELEVANT,
    label: 'All relevant content',
    helperText: 'Standard SciX search across all content.',
  },
  {
    mode: SearchMode.ADS_COMPAT,
    label: 'ADS Compatibility mode',
    helperText: 'Search ADS-style astronomy and physics content, sorted by date.',
  },
] as const;

export const ADS_COMPAT_SORT: SolrSort[] = ['date desc'];
export const ADS_COMPAT_FQ_ENTRY = '{!type=aqp v=$fq_database}';
export const ADS_COMPAT_FQ_DATABASE = '(database:"astronomy" OR database:"physics")';
export const ADS_COMPAT_URL_PARAM = 'ads_compat';

export const buildSearchOutgoing = (query: IADSApiSearchParams, mode: string): IADSApiSearchParams => {
  const withDefaults = applySearchModeDefaults(query, mode);
  return mode === SearchMode.ADS_COMPAT
    ? ({ ...withDefaults, [ADS_COMPAT_URL_PARAM]: '1' } as IADSApiSearchParams)
    : withDefaults;
};

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
