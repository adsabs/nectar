import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const MESSAGE = '<p>Scheduled maintenance on Nov 16</p>';

const loadModule = async () => {
  vi.resetModules();
  return import('./siteWideMsg');
};

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn().mockResolvedValue(okResponse(MESSAGE));
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_HOST_SERVER = 'https://api.example.test/v1';
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchSiteWideMsgServer', () => {
  test('returns the message', async () => {
    const { fetchSiteWideMsgServer } = await loadModule();

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBe(MESSAGE);
  });

  // Next's fetch cache key includes headers, so an Authorization header would
  // make every distinct user token a cache miss for this global message.
  test('serves a second caller with a different token from cache', async () => {
    const { fetchSiteWideMsgServer } = await loadModule();

    await fetchSiteWideMsgServer('token-a');
    await expect(fetchSiteWideMsgServer('token-b')).resolves.toBe(MESSAGE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('refetches once the cache entry expires', async () => {
    const { fetchSiteWideMsgServer, SITE_WIDE_MSG_TTL_MS } = await loadModule();

    await fetchSiteWideMsgServer('token-a');
    vi.advanceTimersByTime(SITE_WIDE_MSG_TTL_MS + 1);
    await fetchSiteWideMsgServer('token-a');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('collapses concurrent misses into a single upstream request', async () => {
    const { fetchSiteWideMsgServer } = await loadModule();

    const results = await Promise.all([
      fetchSiteWideMsgServer('token-a'),
      fetchSiteWideMsgServer('token-b'),
      fetchSiteWideMsgServer('token-c'),
    ]);

    expect(results).toEqual([MESSAGE, MESSAGE, MESSAGE]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('sends the caller token as a bearer', async () => {
    const { fetchSiteWideMsgServer } = await loadModule();

    await fetchSiteWideMsgServer('token-a');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({ Authorization: 'Bearer token-a' });
  });

  test('returns null on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve(null) });
    const { fetchSiteWideMsgServer } = await loadModule();

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBeNull();
  });

  test('returns null when the request rejects', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const { fetchSiteWideMsgServer } = await loadModule();

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBeNull();
  });

  test('returns null when the body is not a string', async () => {
    fetchMock.mockResolvedValue(okResponse({ unexpected: true }));
    const { fetchSiteWideMsgServer } = await loadModule();

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBeNull();
  });

  test('returns null without fetching when there is no token', async () => {
    const { fetchSiteWideMsgServer } = await loadModule();

    await expect(fetchSiteWideMsgServer(undefined)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// RootLayout awaits this before emitting any HTML, so every millisecond it
// blocks is added to the document's TTFB for every route.
describe('fetchSiteWideMsgServer does not put the banner on the critical path', () => {
  test('serves a stale message rather than waiting for the refresh', async () => {
    const { fetchSiteWideMsgServer, SITE_WIDE_MSG_TTL_MS } = await loadModule();

    await fetchSiteWideMsgServer('token-a');
    vi.advanceTimersByTime(SITE_WIDE_MSG_TTL_MS + 1);
    fetchMock.mockImplementation(() => new Promise(() => undefined));

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBe(MESSAGE);
  });

  test('picks up the new message once the background refresh lands', async () => {
    const { fetchSiteWideMsgServer, SITE_WIDE_MSG_TTL_MS } = await loadModule();
    const updated = '<p>All clear</p>';

    await fetchSiteWideMsgServer('token-a');
    vi.advanceTimersByTime(SITE_WIDE_MSG_TTL_MS + 1);
    fetchMock.mockResolvedValue(okResponse(updated));

    await fetchSiteWideMsgServer('token-a');
    await vi.advanceTimersByTimeAsync(0);

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBe(updated);
  });

  test('keeps serving the stale message when the refresh fails', async () => {
    const { fetchSiteWideMsgServer, SITE_WIDE_MSG_TTL_MS } = await loadModule();

    await fetchSiteWideMsgServer('token-a');
    vi.advanceTimersByTime(SITE_WIDE_MSG_TTL_MS + 1);
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await fetchSiteWideMsgServer('token-a');
    await vi.advanceTimersByTimeAsync(0);

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBe(MESSAGE);
  });

  // Without a negative cache an outage makes every single request pay the full
  // abort budget before the layout can emit anything.
  test('does not re-attempt upstream on every request while it is failing', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const { fetchSiteWideMsgServer } = await loadModule();

    await fetchSiteWideMsgServer('token-a');
    await fetchSiteWideMsgServer('token-b');
    await fetchSiteWideMsgServer('token-c');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('retries upstream once the failure cache expires', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const { fetchSiteWideMsgServer, SITE_WIDE_MSG_ERROR_TTL_MS } = await loadModule();

    await fetchSiteWideMsgServer('token-a');
    vi.advanceTimersByTime(SITE_WIDE_MSG_ERROR_TTL_MS + 1);
    fetchMock.mockResolvedValue(okResponse(MESSAGE));

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBe(MESSAGE);
  });

  // "No message" and "the service is broken" are different answers. Conflating
  // them means a withdrawn banner is served from stale cache indefinitely.
  test('reports no message when upstream returns an empty body', async () => {
    fetchMock.mockResolvedValue(okResponse(null));
    const { fetchSiteWideMsgServer } = await loadModule();

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBe('');
  });

  test('clears a stale message once upstream reports it was withdrawn', async () => {
    const { fetchSiteWideMsgServer, SITE_WIDE_MSG_TTL_MS } = await loadModule();

    await fetchSiteWideMsgServer('token-a');
    vi.advanceTimersByTime(SITE_WIDE_MSG_TTL_MS + 1);
    fetchMock.mockResolvedValue(okResponse(null));

    await fetchSiteWideMsgServer('token-a');
    await vi.advanceTimersByTimeAsync(0);

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBe('');
  });

  test('still treats an unrecognised body shape as a failure', async () => {
    fetchMock.mockResolvedValue(okResponse({ unexpected: true }));
    const { fetchSiteWideMsgServer } = await loadModule();

    await expect(fetchSiteWideMsgServer('token-a')).resolves.toBeNull();
  });

  test('holds a failure far more briefly than a success', async () => {
    const { SITE_WIDE_MSG_TTL_MS, SITE_WIDE_MSG_ERROR_TTL_MS } = await loadModule();

    expect(SITE_WIDE_MSG_ERROR_TTL_MS).toBeLessThan(SITE_WIDE_MSG_TTL_MS);
  });
});
