import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetServerSidePropsContext } from 'next';

const captureException = vi.fn();
const captureMessage = vi.fn();
const setTag = vi.fn();
const setExtra = vi.fn();
const setLevel = vi.fn();
const setUser = vi.fn();
const setFingerprint = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
  withScope: (fn: (scope: unknown) => void) => fn({ setTag, setExtra, setLevel, setUser, setFingerprint }),
  getIsolationScope: () => ({ setTag: vi.fn() }),
  addBreadcrumb: vi.fn(),
}));

vi.mock('iron-session/next', () => ({
  withIronSessionSsr: (handler: unknown) => handler,
}));

import { composeNextGSSP } from './ssr-utils';

const createContext = (resolvedUrl = '/abs/2021ApJ...123..456A/abstract'): GetServerSidePropsContext =>
  ({
    req: { session: { token: undefined, isAuthenticated: false }, headers: {} },
    res: { setHeader: vi.fn() },
    query: {},
    params: {},
    resolvedUrl,
  } as unknown as GetServerSidePropsContext);

const tagsSeen = () => Object.fromEntries(setTag.mock.calls.map(([key, value]) => [key, value]));
const extrasSeen = () => Object.fromEntries(setExtra.mock.calls.map(([key, value]) => [key, value]));

beforeEach(() => {
  [captureException, captureMessage, setTag, setExtra, setLevel, setUser, setFingerprint].forEach((mock) =>
    mock.mockReset(),
  );
});

describe('composeNextGSSP error reporting', () => {
  test('a throwing GSSP fn is captured by Sentry exactly once', async () => {
    const boom = new Error('bootstrap exploded before the try block');
    const handler = composeNextGSSP(() => Promise.reject(boom));

    await handler(createContext());

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(boom);
  });

  test('the capture carries the route that failed', async () => {
    const handler = composeNextGSSP(() => Promise.reject(new Error('boom')));

    await handler(createContext());

    expect(extrasSeen()).toMatchObject({ route: '/abs/2021ApJ...123..456A/abstract' });
    expect(tagsSeen()).toMatchObject({ source: 'server', stage: 'gssp-compose' });
  });

  test('the capture records the path only, never the query string', async () => {
    const handler = composeNextGSSP(() => Promise.reject(new Error('boom')));

    await handler(createContext('/search/metrics?q=author%3A%22Smith%2C+J%22&sort=date+desc'));

    expect(extrasSeen()).toMatchObject({ route: '/search/metrics' });
    expect(JSON.stringify(setExtra.mock.calls)).not.toContain('Smith');
    expect(JSON.stringify(setExtra.mock.calls)).not.toContain('sort=date');
  });

  test('the page still receives pageError after a swallowed throw', async () => {
    const handler = composeNextGSSP(() => Promise.reject(new Error('boom')));

    const result = await handler(createContext());

    expect(result).toHaveProperty('props');
    expect((result as { props: Record<string, unknown> }).props.pageError).toBeDefined();
  });

  test('each throw is reported separately', async () => {
    const handler = composeNextGSSP(
      () => Promise.reject(new Error('first')),
      () => Promise.reject(new Error('second')),
    );

    await handler(createContext());

    expect(captureException).toHaveBeenCalledTimes(2);
  });

  test('a clean render reports nothing', async () => {
    const handler = composeNextGSSP(() => Promise.resolve({ props: { ok: true } }));

    const result = await handler(createContext());

    expect(captureException).not.toHaveBeenCalled();
    expect((result as { props: Record<string, unknown> }).props.ok).toBe(true);
  });
});
