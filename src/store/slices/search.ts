import { IADSApiSearchParams } from '@api';
import { AppState, StoreSlice } from '@store';
import { NamedSet } from 'zustand/middleware';

const defaultQueryParams: IADSApiSearchParams = {
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
  sort: ['date desc'],
  start: 0,
  rows: 10,
};
export interface IAppStateSearchSlice {
  query: IADSApiSearchParams;
  latestQuery: IADSApiSearchParams;
  updateQuery: (query: Partial<IADSApiSearchParams>) => void;
  setLatestQuery: (previousQuery: IADSApiSearchParams) => void;
  resetQuery: () => void;
}

export const searchSlice: StoreSlice<IAppStateSearchSlice> = (set: NamedSet<AppState>) => ({
  query: defaultQueryParams,
  latestQuery: defaultQueryParams,

  // directly set the query with passed in value
  // setQuery: (query: IADSApiSearchParams) => set(() => ({ query })),

  // merge the current query with the partial (or complete) passed in query
  updateQuery: (query: Partial<IADSApiSearchParams>) =>
    set((state) => ({ query: { ...state.query, ...query } }), false, 'search/updateQuery'),

  setLatestQuery: (latestQuery: IADSApiSearchParams) => set(() => ({ latestQuery }), false, 'search/setLatestQuery'),
  resetQuery: () => set({ query: defaultQueryParams, latestQuery: defaultQueryParams }),
});
