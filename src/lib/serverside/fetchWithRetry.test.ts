import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { fetchWithRetry, isRetryableStatus } from './fetchWithRetry';
import { server } from '@/mocks/server';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

const res = (status: number): Response => ({ ok: status >= 200 && status < 300, status } as Response);

beforeAll(() => {
  // disable msw for this suite; we stub fetch manually
  server.close();
});

afterAll(() => {
  // restart msw for other suites
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  fetchMock.mockReset();
});

describe('isRetryableStatus', () => {
  test('treats 429 and 5xx as retryable', () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
  });

  test('treats 2xx and 4xx (except 429) as non-retryable', () => {
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });
});

describe('fetchWithRetry', () => {
  test('returns immediately on a 2xx without retrying', async () => {
    fetchMock.mockResolvedValueOnce(res(200));
    const response = await fetchWithRetry('https://x', {}, { backoffMs: 0 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('does not retry a non-retryable 4xx', async () => {
    fetchMock.mockResolvedValueOnce(res(404));
    const response = await fetchWithRetry('https://x', {}, { retries: 2, backoffMs: 0 });
    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('retries a transient 503 and returns the recovered 200', async () => {
    fetchMock.mockResolvedValueOnce(res(503)).mockResolvedValueOnce(res(200));
    const response = await fetchWithRetry('https://x', {}, { retries: 2, backoffMs: 0 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('returns the last response after exhausting retries on a persistent 500', async () => {
    fetchMock.mockResolvedValue(res(500));
    const response = await fetchWithRetry('https://x', {}, { retries: 2, backoffMs: 0 });
    expect(response.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('retries a network error then resolves', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce(res(200));
    const response = await fetchWithRetry('https://x', {}, { retries: 2, backoffMs: 0 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('rethrows a persistent network error after exhausting retries', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    await expect(fetchWithRetry('https://x', {}, { retries: 1, backoffMs: 0 })).rejects.toThrow('ECONNRESET');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('reports each attempt to onAttempt with willRetry flags', async () => {
    fetchMock.mockResolvedValueOnce(res(503)).mockResolvedValueOnce(res(200));
    const attempts: Array<{ attempt: number; status?: number; willRetry: boolean }> = [];
    await fetchWithRetry(
      'https://x',
      {},
      {
        retries: 2,
        backoffMs: 0,
        onAttempt: ({ attempt, status, willRetry }) => attempts.push({ attempt, status, willRetry }),
      },
    );
    expect(attempts).toEqual([
      { attempt: 0, status: 503, willRetry: true },
      { attempt: 1, status: 200, willRetry: false },
    ]);
  });
});
