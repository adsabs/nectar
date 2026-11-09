export const SENTRY_ENVIRONMENT_GLOBAL = '__scixSentryEnvironment';
export const DEFAULT_SENTRY_ENVIRONMENT = 'production';

const SAFE_ENVIRONMENT_RE = /^[\w.-]+$/;

export const resolveSentryEnvironment = (raw?: string): string => {
  const trimmed = raw?.trim() ?? '';
  return SAFE_ENVIRONMENT_RE.test(trimmed) ? trimmed : DEFAULT_SENTRY_ENVIRONMENT;
};

export const getSentryEnvironmentSnippet = (raw?: string): string =>
  `window.${SENTRY_ENVIRONMENT_GLOBAL}=${JSON.stringify(resolveSentryEnvironment(raw))};`;

export const readSentryEnvironment = (): string =>
  resolveSentryEnvironment(typeof window === 'undefined' ? undefined : window[SENTRY_ENVIRONMENT_GLOBAL]);
