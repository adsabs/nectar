import { createContext, useContext } from 'react';

import { IADSApiSearchParams } from '@/api/search/types';
import { SearchStatus } from '@/types';

export interface ISearchQueryContextValue {
  // Canonical params of the active search, shaped for facet/stats consumers
  // (post-boost, no pagination or field-list keys — see toFacetSearchParams).
  // Replaces the store's latestQuery for search-page widgets.
  facetParams: IADSApiSearchParams;
  // lifecycle of the active search — gates facet fetching (SCIX-871)
  searchStatus: SearchStatus;
}

// Default mirrors "no active search": consumers rendered outside the search
// page stay gated exactly like an idle search
const defaultValue: ISearchQueryContextValue = {
  facetParams: { q: '' },
  searchStatus: 'idle',
};

const SearchQueryContext = createContext<ISearchQueryContextValue>(defaultValue);

// Read-only context carrying the active search's canonical query and status
// from the search page down to facets, histogram, and result stats. This is
// intentionally NOT writable — the URL is the source of truth; this only
// distributes derived values.
export const SearchQueryProvider = SearchQueryContext.Provider;

export const useSearchQuery = (): ISearchQueryContextValue => useContext(SearchQueryContext);
