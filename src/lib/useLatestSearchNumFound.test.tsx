import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { FC, ReactNode } from 'react';
import { SEARCH_API_KEYS } from '@/api/search/ui-tags';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { useLatestSearchNumFound } from './useLatestSearchNumFound';

const responseWith = (numFound: number): IADSApiSearchResponse => ({
  responseHeader: { status: 0, QTime: 1, params: { q: 'star' } },
  response: { numFound, docs: [] },
});

const seed = (
  client: QueryClient,
  namespace: SEARCH_API_KEYS,
  params: IADSApiSearchParams,
  data: IADSApiSearchResponse | undefined,
) => {
  client.setQueryData([namespace, params], data);
};

const wrapperFor = (client: QueryClient): FC<{ children?: ReactNode }> =>
  function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

const renderNumFound = (client: QueryClient) =>
  renderHook(() => useLatestSearchNumFound(), { wrapper: wrapperFor(client) });

test('reads the count from the primer when the full page fetch was skipped', () => {
  const client = new QueryClient();
  seed(client, SEARCH_API_KEYS.primary, { q: 'star', rows: 500, start: 0 }, responseWith(1000000));
  seed(client, SEARCH_API_KEYS.primary, { q: 'star', rows: 500, start: 3000 }, responseWith(1000000));
  seed(client, SEARCH_API_KEYS.primaryPrimer, { q: 'quasar', rows: 25, start: 3000 }, responseWith(15));

  expect(renderNumFound(client).result.current).toBe(15);
});

test('answers with the most recently cached search', () => {
  const client = new QueryClient();
  seed(client, SEARCH_API_KEYS.primary, { q: 'star', rows: 500, start: 0 }, responseWith(1000000));
  seed(client, SEARCH_API_KEYS.primary, { q: 'quasar', rows: 500, start: 0 }, responseWith(42));

  expect(renderNumFound(client).result.current).toBe(42);
});

test('does not answer from a single cached search', () => {
  const client = new QueryClient();
  seed(client, SEARCH_API_KEYS.primary, { q: 'star', rows: 500, start: 0 }, responseWith(1000000));

  expect(renderNumFound(client).result.current).toBeUndefined();
});

test('ignores cached searches from other surfaces', () => {
  const client = new QueryClient();
  seed(client, SEARCH_API_KEYS.preview, { q: 'star', rows: 10, start: 0 }, responseWith(99));
  seed(client, SEARCH_API_KEYS.infinite, { q: 'star', rows: 10, start: 0 }, responseWith(77));

  expect(renderNumFound(client).result.current).toBeUndefined();
});

test('tolerates a cached entry with no response body', () => {
  const client = new QueryClient();
  seed(client, SEARCH_API_KEYS.primary, { q: 'star', rows: 500, start: 0 }, responseWith(1000000));
  seed(client, SEARCH_API_KEYS.primaryPrimer, { q: 'quasar', rows: 25, start: 0 }, undefined);

  expect(renderNumFound(client).result.current).toBeUndefined();
});
