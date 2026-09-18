import type { IADSApiSearchParams } from '@/api/search/types';
import { safeGetArray } from '@/components/SearchFacet/helpers';
import { setFQ } from '@/query-utils';
import { getTerms } from '@/query';
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

// ClassicForm emits unquoted terms; strip quotes before comparing.
const stripQuotes = (term: string): string => term.replace(/"/g, '');
const ADS_COMPAT_DATABASE_TERMS = new Set(getTerms(ADS_COMPAT_FQ_DATABASE).map(stripQuotes));

// Matches the full compat default or any subset left after a pill removal.
const isCompatDatabaseFilter = (value: string | undefined): boolean => {
  if (typeof value !== 'string' || value === '') {
    return false;
  }
  const terms = getTerms(value).map(stripQuotes);
  return terms.length > 0 && terms.every((term) => ADS_COMPAT_DATABASE_TERMS.has(term));
};

export const buildSearchOutgoing = (query: IADSApiSearchParams, mode: string): IADSApiSearchParams => {
  const withDefaults = applySearchModeDefaults(query, mode);
  return mode === SearchMode.ADS_COMPAT
    ? ({ ...withDefaults, [ADS_COMPAT_URL_PARAM]: '1' } as IADSApiSearchParams)
    : (omit([ADS_COMPAT_URL_PARAM], withDefaults) as IADSApiSearchParams);
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
    const alreadyInCompat = query[ADS_COMPAT_URL_PARAM] === '1';

    if (alreadyInCompat) {
      // Never re-add the compat defaults once inside compat mode; an absent
      // or empty fq_database means the user cleared every collection pill.
      const hasFqDatabase = typeof query.fq_database === 'string' && query.fq_database !== '';
      const withCollections = hasFqDatabase
        ? (setFQ('database', query.fq_database as string, query, { asIs: true }) as IADSApiSearchParams)
        : query;
      return { ...withCollections, sort: ADS_COMPAT_SORT };
    }

    // Entering compat mode fresh: replace any existing fq_database (e.g. a
    // saved defaultDatabase) instead of AND-joining, which would return
    // almost nothing (`earthscience AND (astronomy OR physics)`).
    const withCollections = setFQ('database', ADS_COMPAT_FQ_DATABASE, query, {
      asIs: true,
    }) as IADSApiSearchParams;
    return { ...withCollections, sort: ADS_COMPAT_SORT };
  }

  // /search has no in-page mode toggle, so ads_compat=1 is the only signal
  // we're leaving compat mode rather than reading a normal user's own
  // Collections pick (astronomy/physics are valid choices there too).
  const cameFromCompat = query[ADS_COMPAT_URL_PARAM] === '1';
  if (cameFromCompat && isCompatDatabaseFilter(query.fq_database as string | undefined)) {
    // A single fq param parses as a bare string, not an array.
    const fqWithout = safeGetArray(query.fq as string | string[]).filter((f) => f !== ADS_COMPAT_FQ_ENTRY);
    const withoutDb = omit(['fq_database', ADS_COMPAT_URL_PARAM], query) as IADSApiSearchParams;
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
