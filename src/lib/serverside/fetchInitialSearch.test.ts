import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchInitialSearch, SEARCH_SEED_TIMEOUT_MS } from './fetchInitialSearch';
import { APP_DEFAULTS } from '@/config';
import type { IADSApiSearchParams } from '@/api/search/types';

const SOLR_PARAMS: IADSApiSearchParams = { q: 'star', rows: 10, sort: ['date desc'] };
const PAYLOAD = { response: { numFound: 2, docs: [{ bibcode: 'a' }, { bibcode: 'b' }] } };

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(PAYLOAD) });
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_HOST_SERVER = 'https://api.example.test/v1';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchInitialSearch', () => {
  test('returns the payload with the identity of the query it answers', async () => {
    const result = await fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS });

    expect(result?.data).toEqual(PAYLOAD);
    expect(typeof result?.queryHash).toBe('string');
    expect(result?.queryHash.length).toBeGreaterThan(0);
  });

  test('sends the token as a bearer and does not cache the response', async () => {
    await fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/search/query?');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(init.cache).toBe('no-store');
  });

  test('returns null without fetching when there is no token', async () => {
    await expect(fetchInitialSearch({ token: undefined, solrParams: SOLR_PARAMS })).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns null on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve(null) });

    await expect(fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS })).resolves.toBeNull();
  });

  // An unhandled rejection here would render Next's error page instead of
  // degrading to the client-side fetch, which is strictly worse.
  test('returns null when the request rejects', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS })).resolves.toBeNull();
  });

  test('returns null when the body is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    });

    await expect(fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS })).resolves.toBeNull();
  });

  test('passes an abort signal so a stalled upstream cannot hang the stream', async () => {
    await fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal).toBeDefined();
  });

  test('returns null when the request is aborted', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));

    await expect(fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS })).resolves.toBeNull();
  });

  test('returns null when the body is json but not a search response', async () => {
    fetchMock.mockResolvedValue(okResponse({ error: 'upstream gateway' }));

    await expect(fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS })).resolves.toBeNull();
  });
});

describe('fetchInitialSearch seed budget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const pendingUntilAborted = () => {
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) => {
      signal = init.signal;
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        );
      });
    });
    return () => signal;
  };

  test('is short enough that giving up beats waiting', () => {
    expect(SEARCH_SEED_TIMEOUT_MS).toBe(2500);
  });

  test('does not inherit the shared server api timeout', () => {
    expect(SEARCH_SEED_TIMEOUT_MS).not.toBe(APP_DEFAULTS.SSR_API_TIMEOUT);
  });

  test('abandons a stalled upstream once the budget elapses', async () => {
    const signal = pendingUntilAborted();
    const pending = fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS });

    await vi.advanceTimersByTimeAsync(SEARCH_SEED_TIMEOUT_MS);

    await expect(pending).resolves.toBeNull();
    expect(signal()?.aborted).toBe(true);
  });

  test('leaves the request alone until the budget elapses', async () => {
    const signal = pendingUntilAborted();
    void fetchInitialSearch({ token: 'tok', solrParams: SOLR_PARAMS });

    await vi.advanceTimersByTimeAsync(SEARCH_SEED_TIMEOUT_MS - 1);

    expect(signal()?.aborted).toBe(false);
  });
});
