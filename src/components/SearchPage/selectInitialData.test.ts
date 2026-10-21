import { describe, expect, test } from 'vitest';
import { selectInitialData } from './selectInitialData';
import type { IADSApiSearchResponse } from '@/api/search/types';

const response: IADSApiSearchResponse = { response: { numFound: 3, docs: [] } };

describe('selectInitialData', () => {
  test('uses the server response when the query identities match', () => {
    expect(selectInitialData({ initialData: response, initialQueryHash: 'abc', queryHash: 'abc' })).toBe(response);
  });

  // The server resolves numPerPage/mode from the cookie, the client from
  // zustand; staleTime: Infinity would make a mismatched seed permanent.
  test('discards the server response when the identities differ', () => {
    expect(selectInitialData({ initialData: response, initialQueryHash: 'abc', queryHash: 'xyz' })).toBeUndefined();
  });

  test('discards the response when the server sent no identity', () => {
    expect(selectInitialData({ initialData: response, initialQueryHash: undefined, queryHash: 'abc' })).toBeUndefined();
  });

  test('is undefined when there is no server response', () => {
    expect(selectInitialData({ initialData: undefined, initialQueryHash: 'abc', queryHash: 'abc' })).toBeUndefined();
  });

  test('never matches on two missing identities', () => {
    expect(
      selectInitialData({ initialData: response, initialQueryHash: undefined, queryHash: undefined }),
    ).toBeUndefined();
  });
});
