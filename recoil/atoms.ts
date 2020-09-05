import { atom } from 'recoil';

export const queryState = atom({
  default: '',
  key: 'query',
});

export const searchState = atom({
  default: null,
  key: 'search',
});
