import type { SearchResult } from './../api/search';
import { atom } from 'recoil';

export const queryState = atom({
  default: '',
  key: 'query',
});

export const resultState = atom<SearchResult>({
  default: { numFound: 0, start: 0, docs: [] },
  key: 'result',
});

export const selectedDocsState = atom<string[]>({
  default: [],
  key: 'selectedDocs',
});
