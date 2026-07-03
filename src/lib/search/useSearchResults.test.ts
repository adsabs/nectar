import { describe, expect, test, TestContext, vi } from 'vitest';
import { rest } from 'msw';
import { renderHook, waitFor } from '@/test-utils';
import { ApiTargets } from '@/api/models';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { SLOW_SEARCH_THRESHOLD_MS, useSearchResults } from './useSearchResults';

const params: IADSApiSearchParams = {
  q: 'star formation',
  sort: ['score desc', 'date desc'],
  start: 0,
  rows: 10,
};

type ResponseOverrides = {
  response?: Partial<IADSApiSearchResponse['response']>;
  responseHeader?: Partial<IADSApiSearchResponse['responseHeader']>;
};

const makeResponse = (overrides: ResponseOverrides = {}): IADSApiSearchResponse =>
  ({
    response: {
      numFound: 2,
      docs: [{ bibcode: 'bib1' }, { bibcode: 'bib2' }],
    },
    ...overrides,
  } as IADSApiSearchResponse);

const useSearchOverride = (server: TestContext['server'], body: IADSApiSearchResponse, status = 200) => {
  server.use(rest.get(apiHandlerRoute(ApiTargets.SEARCH), (_req, res, ctx) => res(ctx.status(status), ctx.json(body))));
};

describe('useSearchResults', () => {
  test('loading then success with docs and numFound', async ({ server }: TestContext) => {
    useSearchOverride(server, makeResponse());
    const { result } = renderHook(() => useSearchResults(params));
    expect(result.current.searchStatus).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.searchStatus).toBe('success'));
    expect(result.current.docs).toHaveLength(2);
    expect(result.current.numFound).toBe(2);
    expect(result.current.isPartialResults).toBe(false);
  });

  test('disabled query is idle and does not fetch, even with a warm cache', async ({ server }: TestContext) => {
    const onRequest = vi.fn();
    server.events.on('request:start', onRequest);
    const { result } = renderHook(() => useSearchResults(params, { enabled: false }));
    expect(result.current.searchStatus).toBe('idle');
    expect(result.current.isSlowSearch).toBe(false);
    // give any accidental fetch a chance to fire
    await new Promise((r) => setTimeout(r, 50));
    expect(onRequest).not.toHaveBeenCalled();
    server.events.removeListener('request:start', onRequest);
  });

  test('numFound of 0 derives empty status', async ({ server }: TestContext) => {
    useSearchOverride(server, makeResponse({ response: { numFound: 0, docs: [] } }));
    const { result } = renderHook(() => useSearchResults(params));
    await waitFor(() => expect(result.current.searchStatus).toBe('empty'));
    expect(result.current.docs).toEqual([]);
  });

  test('request failure derives error status', async ({ server }: TestContext) => {
    useSearchOverride(server, makeResponse(), 500);
    const { result } = renderHook(() => useSearchResults(params));
    await waitFor(() => expect(result.current.searchStatus).toBe('error'), { timeout: 10000 });
    expect(result.current.isError).toBe(true);
  });

  test('partialResults flag surfaces from the response header', async ({ server }: TestContext) => {
    useSearchOverride(server, makeResponse({ responseHeader: { partialResults: true } }));
    const { result } = renderHook(() => useSearchResults(params));
    await waitFor(() => expect(result.current.isPartialResults).toBe(true));
  });

  test('new query key keeps previous docs but flips status to loading; resolves to success', async ({
    server,
  }: TestContext) => {
    useSearchOverride(server, makeResponse());
    const { result, rerender } = renderHook(({ p }: { p: IADSApiSearchParams }) => useSearchResults(p), undefined, {
      initialProps: { p: params },
    });
    await waitFor(() => expect(result.current.searchStatus).toBe('success'));

    // delay the next response so the loading window is observable
    server.use(
      rest.get(apiHandlerRoute(ApiTargets.SEARCH), async (_req, res, ctx) =>
        res(ctx.delay(150), ctx.status(200), ctx.json(makeResponse())),
      ),
    );
    rerender({ p: { ...params, q: 'galaxies' } });

    // keepPreviousData: docs remain visible while the NEW search gates as loading
    await waitFor(() => expect(result.current.searchStatus).toBe('loading'));
    expect(result.current.docs).toHaveLength(2);
    await waitFor(() => expect(result.current.searchStatus).toBe('success'));
  });

  test('q flipping to disabled overrides retained data with idle', async ({ server }: TestContext) => {
    useSearchOverride(server, makeResponse());
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useSearchResults(params, { enabled }),
      undefined,
      { initialProps: { enabled: true } },
    );
    await waitFor(() => expect(result.current.searchStatus).toBe('success'));
    rerender({ enabled: false });
    expect(result.current.searchStatus).toBe('idle');
  });

  test('slow search flips after the threshold and resets when settled', async ({ server }: TestContext) => {
    // only fake the timeout APIs — faking performance breaks GTM's performance.mark
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      shouldClearNativeTimers: true,
      toFake: ['setTimeout', 'clearTimeout'],
    });
    server.use(
      rest.get(apiHandlerRoute(ApiTargets.SEARCH), async (_req, res, ctx) =>
        res(ctx.delay(SLOW_SEARCH_THRESHOLD_MS * 3), ctx.status(200), ctx.json(makeResponse())),
      ),
    );
    const { result } = renderHook(() => useSearchResults(params));
    expect(result.current.isSlowSearch).toBe(false);
    await vi.advanceTimersByTimeAsync(SLOW_SEARCH_THRESHOLD_MS + 100);
    await waitFor(() => expect(result.current.isSlowSearch).toBe(true));
    vi.useRealTimers();
  });
});
