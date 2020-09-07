import { selector } from 'recoil';
import { resultState } from './atoms';

export const numFoundState = selector({
  key: 'numfound',
  get: ({ get }) => {
    const { numFound } = get(resultState);
    return numFound;
  },
});
