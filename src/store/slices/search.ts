import { IADSApiSearchParams } from '@api';
import { AppState, StoreSlice } from '@store';
import { mergeRight } from 'ramda';
import { NamedSet } from 'zustand/middleware';

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
  ],
  sort: ['date desc', 'bibcode desc'],
  start: 0,
  rows: 10,
};
export interface IAppStateSearchSlice {
  query: IADSApiSearchParams;
  latestQuery: IADSApiSearchParams;
  prevQuery: IADSApiSearchParams;
  setQuery: (query: IADSApiSearchParams) => void;
  updateQuery: (query: Partial<IADSApiSearchParams>) => void;
  swapQueries: () => void;
  submitQuery: () => void;
  resetQuery: () => void;
}

export const searchSlice: StoreSlice<IAppStateSearchSlice> = (set: NamedSet<AppState>) => ({
  // intermediate query, this one will be changing frequently
  query: defaultQueryParams,

  // can only be updated using `submitQuery` which just moves the current query over
  latestQuery: defaultQueryParams,

  prevQuery: defaultQueryParams,

  setQuery: (query: IADSApiSearchParams) => set(() => ({ query })),

  // merge the current query with the partial (or complete) passed in query
  updateQuery: (query: Partial<IADSApiSearchParams>) =>
    set((state) => ({ query: mergeRight(state.query, query) }), false, 'search/updateQuery'),

  submitQuery: () =>
    set((state) => ({ prevQuery: state.latestQuery, latestQuery: state.query }), false, 'search/submitQuery'),
  swapQueries: () =>
    set((state) => ({ latestQuery: state.prevQuery, prevQuery: state.latestQuery }), false, 'search/swapQueries'),
  resetQuery: () => set({ query: defaultQueryParams, latestQuery: defaultQueryParams }, false, 'search/resetQuery'),
});
