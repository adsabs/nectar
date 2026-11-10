import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  DEFAULT_SENTRY_ENVIRONMENT,
  getSentryEnvironmentSnippet,
  readSentryEnvironment,
  resolveSentryEnvironment,
  SENTRY_ENVIRONMENT_GLOBAL,
} from './sentryEnvironment';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveSentryEnvironment', () => {
  test.each([
    ['ads-prod', 'ads-prod'],
    ['ads-qa', 'ads-qa'],
    ['  ads-prod  ', 'ads-prod'],
    ['v1.2_rc', 'v1.2_rc'],
  ])('keeps %o as %o', (raw, expected) => {
    expect(resolveSentryEnvironment(raw)).toBe(expected);
  });

  test.each([[undefined], [''], ['   '], ['ads prod'], ['</script><script>alert(1)</script>'], ['"; alert(1); "']])(
    'falls back to the default for %o',
    (raw) => {
      expect(resolveSentryEnvironment(raw)).toBe(DEFAULT_SENTRY_ENVIRONMENT);
    },
  );
});

describe('getSentryEnvironmentSnippet', () => {
  test('assigns the resolved environment to the agreed global', () => {
    expect(getSentryEnvironmentSnippet('ads-prod')).toBe(`window.${SENTRY_ENVIRONMENT_GLOBAL}="ads-prod";`);
  });

  test('emits no script-closing sequence for a hostile value', () => {
    const snippet = getSentryEnvironmentSnippet('</script><script>alert(1)</script>');

    expect(snippet).toBe(`window.${SENTRY_ENVIRONMENT_GLOBAL}="${DEFAULT_SENTRY_ENVIRONMENT}";`);
    expect(snippet).not.toContain('</script>');
  });
});

describe('readSentryEnvironment', () => {
  test('reads the value the server injected', () => {
    vi.stubGlobal('window', { [SENTRY_ENVIRONMENT_GLOBAL]: 'ads-prod' });

    expect(readSentryEnvironment()).toBe('ads-prod');
  });

  test('falls back to the default when nothing was injected', () => {
    vi.stubGlobal('window', {});

    expect(readSentryEnvironment()).toBe(DEFAULT_SENTRY_ENVIRONMENT);
  });

  test('falls back to the default off the browser', () => {
    vi.stubGlobal('window', undefined);

    expect(readSentryEnvironment()).toBe(DEFAULT_SENTRY_ENVIRONMENT);
  });
});
