import type { IUserData } from '@/api/user/types';

export type SentryAuthTag = 'authed' | 'anon';

export const SENTRY_AUTH_COOKIE_NAME = 'scix_auth';

const COOKIE_RE = new RegExp(`(?:^|; )${SENTRY_AUTH_COOKIE_NAME}=([^;]*)`);

export const authTagForSession = (isAuthenticated: boolean): SentryAuthTag => (isAuthenticated ? 'authed' : 'anon');

export const authTagForUser = (user: Partial<Pick<IUserData, 'anonymous'>> | null | undefined): SentryAuthTag =>
  authTagForSession(user?.anonymous === false);

export const readAuthTag = (cookieSource?: string): SentryAuthTag => {
  const raw = cookieSource ?? (typeof document !== 'undefined' ? document?.cookie : '') ?? '';
  const match = raw.match(COOKIE_RE);
  return match?.[1] === 'authed' ? 'authed' : 'anon';
};
