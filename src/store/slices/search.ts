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
    'reference_count',
    'citation_count',
    'citation_count_norm',
    'credit',
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
  numPerPage: NumPerPageType;
  queryAddition: string;
  clearQueryFlag: boolean;
}

export interface ISearchAction {
  updateQuery: (query: Partial<IADSApiSearchParams>) => void;
  setNumPerPage: (numPerPage: NumPerPageType) => void;
  setQueryAddition: (queryAddition: string) => void;
  setClearQueryFlag: (clearQueryFlag: boolean) => void;
}

// The submitted query lives in the URL (nuqs); this slice only holds the
// SearchBar's intermediate draft state and the numPerPage preference.
export const searchSlice: StoreSlice<ISearchState & ISearchAction> = (set) => ({
  // intermediate query, this one will be changing frequently
  query: defaultQueryParams,

  numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
  queryAddition: null,
  clearQueryFlag: false,

  setNumPerPage: (numPerPage: NumPerPageType) =>
    set(
      () => ({ numPerPage: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE }),
      false,
      'search/setNumPerPage',
    ),

  // merge the current query with the partial (or complete) passed in query
  updateQuery: (query: Partial<IADSApiSearchParams>) =>
    set((state) => ({ query: mergeRight(state.query, query) }), false, 'search/updateQuery'),

  setQueryAddition: (queryAddition: string) => set(() => ({ queryAddition }), false, 'search/setQueryAddition'),
  setClearQueryFlag: (clearQueryFlag: boolean) => set(() => ({ clearQueryFlag }), false, 'search/setClearQueryFlag'),
});
