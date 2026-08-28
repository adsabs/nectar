import { createServerListenerMocks, renderHook, waitFor } from '@/test-utils';
import { expect, test } from 'vitest';
import type { TestContext } from 'vitest';
import { IADSApiSearchParams } from '@/api/search/types';
import { useAbstracts } from './useAbstracts';

const latestQuery: IADSApiSearchParams = {
  q: 'star',
  fl: ['bibcode'],
  sort: ['date desc'],
  start: 0,
  rows: 5,
};

const searchRequestsFrom = (onRequest: { mock: { calls: { 0: { url: URL } }[] } }) =>
  onRequest.mock.calls.map((call) => call[0].url).filter((url) => url.pathname.endsWith('/search/query'));

test('issues a single bulk abstract fetch keyed by bibcode when showAbstracts is on', async ({
  server,
}: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  const { result } = renderHook(() => useAbstracts(), {
    initialStore: { showAbstracts: true, latestQuery },
  });

  await waitFor(() => expect(Object.keys(result.current.abstracts).length).toBeGreaterThan(0));

  const searchRequests = searchRequestsFrom(onRequest);
  expect(searchRequests).toHaveLength(1);
  expect(searchRequests[0].search).toContain('abstract');

  // key is a bibcode, not an array index
  const [firstBibcode] = Object.keys(result.current.abstracts);
  expect(firstBibcode).not.toMatch(/^\d+$/);
  expect(typeof result.current.abstracts[firstBibcode]).toBe('string');
});

test('does not fetch while showAbstracts is off', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  const { result } = renderHook(() => useAbstracts(), {
    initialStore: { showAbstracts: false, latestQuery },
  });

  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(searchRequestsFrom(onRequest)).toHaveLength(0);
  expect(result.current.abstracts).toEqual({});
});

test('does not fetch when disabled even if showAbstracts is on', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  const { result } = renderHook(() => useAbstracts({ enabled: false }), {
    initialStore: { showAbstracts: true, latestQuery },
  });

  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(searchRequestsFrom(onRequest)).toHaveLength(0);
  expect(result.current.abstracts).toEqual({});
});
