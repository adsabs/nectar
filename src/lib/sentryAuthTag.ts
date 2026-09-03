export type SentryAuthTag = 'authed' | 'anon';

export const SENTRY_AUTH_COOKIE_NAME = 'scix_auth';
export const SENTRY_AUTH_TAG_NAME = 'auth';

const COOKIE_RE = new RegExp(`(?:^|; )${SENTRY_AUTH_COOKIE_NAME}=([^;]*)`);

// isAuthenticated is optional on the iron-session shim, so an uninitialized
// session lands here as undefined — that is not authed.
export const authTagForSession = (isAuthenticated?: boolean): SentryAuthTag =>
  isAuthenticated === true ? 'authed' : 'anon';

export const readAuthTag = (cookieSource?: string): SentryAuthTag => {
  const raw = cookieSource ?? (typeof document !== 'undefined' ? document?.cookie : '') ?? '';
  const match = raw.match(COOKIE_RE);
  return match?.[1] === 'authed' ? 'authed' : 'anon';
};
