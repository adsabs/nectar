import { SearchParams, SearchResult } from '@api/search';
import { atom } from 'recoil';

export const queryState = atom<SearchParams>({
  default: { q: '', fl: '', sort: '', rows: 10 },
  key: 'query',
});

export const isSubmittingSearchState = atom<boolean>({
  default: false,
  key: 'isSubmittingSearch',
});

export const resultState = atom<Omit<SearchResult, 'start'>>({
  default: { numFound: 0, docs: [] },
  key: 'result',
});

export const selectedDocsState = atom<string[]>({
  default: [],
  key: 'selectedDocs',
});

export const sortState = atom<string>({
  default: 'date desc',
  key: 'sort',
});
