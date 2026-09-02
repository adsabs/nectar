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
  const Sentry = await import('@sentry/nextjs');
  vi.mocked(Sentry.init).mockClear();
  vi.resetModules();
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
});
