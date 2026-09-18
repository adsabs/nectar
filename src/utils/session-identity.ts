import { IUserData } from '@/api/user/types';

/**
 * A session worth attaching a GA User-ID to.
 *
 * Standalone, not built on isValidToken: that path compares a parseInt'd
 * expiry with >=, so NaN reads as "not expired", and importing auth-utils here
 * closes a circular import through api.ts.
 */
export const isTrackableSession = (user?: IUserData): user is IUserData => {
  if (!user || user.anonymous) {
    return false;
  }

  const { username, access_token: accessToken, expires_at: expiresAt } = user;
  if (typeof username !== 'string' || username.length === 0) {
    return false;
  }
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return false;
  }

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && Math.floor(Date.now() / 1000) < expiry;
};
