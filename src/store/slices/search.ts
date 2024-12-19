import { APP_DEFAULTS } from '@/config';
import { StoreSlice } from '@/store';
import { NumPerPageType } from '@/types';
import { mergeRight } from 'ramda';
import { isNumPerPageType } from '@/utils/common/guards';
import { IADSApiSearchParams } from '@/api/search/types';

export const defaultQueryParams: IADSApiSearchParams = {
  q: '',
  fl: [
    'bibcode',
    'title',
    'author',
    '[fields author=10]',
    'author_count',
    'pubdate',
    'bibstem',
    '[citations]',
    'citation_count',
    'citation_count_norm',
    'esources',
    'property',
    'data',
    'id',
  ],
  sort: APP_DEFAULTS.SORT,
  start: 0,
  rows: APP_DEFAULTS.RESULT_PER_PAGE,
};

export interface ISearchState {
  query: IADSApiSearchParams;
  latestQuery: IADSApiSearchParams;
  prevQuery: IADSApiSearchParams;
  numPerPage: NumPerPageType;
  showHighlights: boolean;
  queryAddition: string;
  clearQueryFlag: boolean;
}

export interface ISearchAction {
  setQuery: (query: IADSApiSearchParams) => void;
  updateQuery: (query: Partial<IADSApiSearchParams>) => void;
  swapQueries: () => void;
  submitQuery: () => void;
  resetQuery: () => void;
  setNumPerPage: (numPerPage: NumPerPageType) => void;
  toggleShowHighlights: () => void;
  setQueryAddition: (queryAddition: string) => void;
  setClearQueryFlag: (clearQueryFlag: boolean) => void;
}

export const searchSlice: StoreSlice<ISearchState & ISearchAction> = (set) => ({
  // intermediate query, this one will be changing frequently
  query: defaultQueryParams,

  // can only be updated using `submitQuery` which just moves the current query over
  latestQuery: defaultQueryParams,
  prevQuery: defaultQueryParams,
  numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
  showHighlights: false,
  queryAddition: null,
  clearQueryFlag: false,

  setNumPerPage: (numPerPage: NumPerPageType) =>
    set(
      () => ({ numPerPage: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE }),
      false,
      'search/setNumPerPage',
    ),

  setQuery: (query: IADSApiSearchParams) => set(() => ({ query })),

  // merge the current query with the partial (or complete) passed in query
  updateQuery: (query: Partial<IADSApiSearchParams>) =>
    set((state) => ({ query: mergeRight(state.query, query) }), false, 'search/updateQuery'),

  submitQuery: () =>
    set((state) => ({ prevQuery: state.latestQuery, latestQuery: state.query }), false, 'search/submitQuery'),
  swapQueries: () =>
    set((state) => ({ latestQuery: state.prevQuery, prevQuery: state.latestQuery }), false, 'search/swapQueries'),
  resetQuery: () => set({ query: defaultQueryParams, latestQuery: defaultQueryParams }, false, 'search/resetQuery'),
  toggleShowHighlights: () =>
    set(({ showHighlights }) => ({ showHighlights: !showHighlights }), false, 'search/toggleShowHighlights'),
  setQueryAddition: (queryAddition: string) => set(() => ({ queryAddition }), false, 'search/setQueryAddition'),
  setClearQueryFlag: (clearQueryFlag: boolean) => set(() => ({ clearQueryFlag }), false, 'search/setClearQueryFlag'),
});
