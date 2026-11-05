import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  replayIntegration: vi.fn(),
  browserTracingIntegration: vi.fn(),
  feedbackIntegration: vi.fn(),
  spanToJSON: vi.fn(),
}));

// Sentry.init's options are a union across browser/node/edge SDKs, so read the
// captured call as a plain record rather than narrowing per runtime.
const loadInitOptions = async (configPath: string): Promise<Record<string, unknown>> => {
  vi.resetModules();
  const Sentry = await import('@sentry/nextjs');
  vi.mocked(Sentry.init).mockClear();
  await import(configPath);

  const [options] = vi.mocked(Sentry.init).mock.calls[0];
  return { ...options };
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('sentry.server.config', () => {
  test('reports the environment the deployment was given', async () => {
    vi.stubEnv('SENTRY_ENVIRONMENT', 'qa');

    const options = await loadInitOptions('./sentry.server.config');

    expect(options.environment).toBe('qa');
  });

  test('falls back to production so prod dashboards survive an unset var', async () => {
    vi.stubEnv('SENTRY_ENVIRONMENT', undefined);

    const options = await loadInitOptions('./sentry.server.config');

    expect(options.environment).toBe('production');
  });
});

describe('sentry.client.config', () => {
  test.each([
    ['scix_auth=authed', 'authed'],
    ['scix_auth=anon', 'anon'],
    ['', 'anon'],
  ])('tags the pageload span from cookie %o as auth=%s', async (cookie, expected) => {
    vi.stubGlobal('document', { cookie });

    const options = await loadInitOptions('./sentry.client.config');
    const { tags } = options.initialScope as { tags: Record<string, string> };

    expect(tags.auth).toBe(expected);
    expect(tags.app).toBe('nectar');
  });

  const matchesAny = (patterns: Array<string | RegExp>, value: string): boolean =>
    patterns.some((pattern) => (typeof pattern === 'string' ? value.includes(pattern) : pattern.test(value)));

  const loadClientFilters = async () => {
    const options = await loadInitOptions('./sentry.client.config');
    return {
      ignoreErrors: options.ignoreErrors as Array<string | RegExp>,
      denyUrls: options.denyUrls as Array<string | RegExp>,
    };
  };

  test.each([
    'ReferenceError: _vwo_code is not defined',
    'ReferenceError: pintrk is not defined',
    'ReferenceError: googletag is not defined',
    'ReferenceError: fbq is not defined',
    'NS_ERROR_NOT_INITIALIZED: No error message',
  ])('drops injected third-party noise: %s', async (message) => {
    const { ignoreErrors } = await loadClientFilters();

    expect(matchesAny(ignoreErrors, message)).toBe(true);
  });

  test.each([
    'Error: Empty session',
    'Error: Typesetting failed: {"isTrusted":true}',
    'Unknown error',
    'AxiosError: Request failed with status code 401',
    'Error: Bootstrap failed during abstract SSR',
    'ReferenceError: formatDate is not defined',
  ])('keeps reporting our own errors: %s', async (message) => {
    const { ignoreErrors } = await loadClientFilters();

    expect(matchesAny(ignoreErrors, message)).toBe(false);
  });

  test.each([
    'chrome-extension://abcdefghijklmnop/inject.js',
    'moz-extension://abcdefghijklmnop/inject.js',
    'safari-web-extension://ABCDEF/inject.js',
    'https://scixplorer-org.translate.goog/_next/static/chunks/abc.js',
  ])('drops errors raised from %s', async (url) => {
    const { denyUrls } = await loadClientFilters();

    expect(matchesAny(denyUrls, url)).toBe(true);
  });

  test.each([
    'https://scixplorer.org/_next/static/chunks/abc.js',
    'https://scixplorer.org/abs/2026ApJ..1008...36N/abstract',
    'blob:https://scixplorer.org/0d8e2f94-1f1d-4a2c-9c2f-7f1f5f8a9b10',
  ])('keeps errors raised from %s', async (url) => {
    const { denyUrls } = await loadClientFilters();

    expect(matchesAny(denyUrls, url)).toBe(false);
  });
});
