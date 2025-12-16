import { IronSession } from 'iron-session';
import { ApiTargets } from '@/api/models';
import { IBootstrapPayload, IUserData } from '@/api/user/types';
import { pick } from 'ramda';
import { edgeLogger } from '@/logger';
import { NextRequest, NextResponse } from 'next/server';
import setCookie from 'set-cookie-parser';
import { botCheck } from '@/middlewares/botCheck';
import { createErrorHandler, ErrorSource } from '@/lib/errorHandler.edge';

const log = edgeLogger.child({}, { msgPrefix: '[initSession] ' });
const handleMiddlewareError = createErrorHandler({
  source: ErrorSource.MIDDLEWARE,
  tags: { middleware: 'initSession' },
});

/**
 * Checks if the user data is valid
 * @param userData
 */
export const isUserData = (userData?: IUserData): userData is IUserData =>
  typeof userData !== 'undefined' &&
  typeof userData.access_token === 'string' &&
  typeof userData.expires_at === 'string' &&
  userData.access_token.length > 0 &&
  userData.expires_at.length > 0;

/**
 * Checks if a token is expired based on the expiration time.
 *
 * @param {string} expiresAt - The expiration time of the token in seconds since the Unix epoch.
 * @returns {boolean} - Returns true if the current time is greater than or equal to the expiration time, false otherwise.
 */
export const isTokenExpired = (expiresAt: string): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  const tokenExpiryTime = parseInt(expiresAt, 10);
  return currentTime >= tokenExpiryTime;
};

/**
 * Checks if the token is valid
 * @param userData
 */
export const isValidToken = (userData?: IUserData): boolean =>
  isUserData(userData) && !isTokenExpired(userData.expires_at);

/**
 * Checks if the user is authenticated
 * @param user
 */
export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

/**
 * Bootstraps the session (to get a new token)
 * @param cookie
 * @param testHeaders - Optional headers for E2E testing scenarios
 */
const bootstrap = async (cookie?: string, testHeaders?: Record<string, string>) => {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    return {
      token: {
        access_token: 'mocked',
        username: 'mocked',
        anonymous: false,
        expires_at: 'mocked',
      },
      headers: new Headers({
        'set-cookie': `${process.env.ADS_SESSION_COOKIE_NAME}=mocked`,
      }),
    };
  }

  const url = `${process.env.API_HOST_SERVER}${ApiTargets.BOOTSTRAP}`;
  const headers = new Headers();

  // use the incoming session cookie to perform the bootstrap
  if (cookie) {
    headers.append('cookie', `${process.env.ADS_SESSION_COOKIE_NAME}=${cookie}`);
  }

  if (testHeaders) {
    Object.entries(testHeaders).forEach(([key, value]) => {
      headers.append(key, value);
    });
  }

  try {
    log.debug({ url, headers }, 'Bootstrapping');
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read response body');
      handleMiddlewareError(new Error(`Bootstrap request failed: ${res.status} ${res.statusText}`), {
        context: {
          status: res.status,
          statusText: res.statusText,
          body: errorText,
          url,
        },
      });
      return null;
    }

    const json = (await res.json()) as IBootstrapPayload;
    log.debug({
      msg: 'Bootstrap successful',
      payload: json,
    });
    return {
      token: pick(['access_token', 'username', 'anonymous', 'expires_at'], json) as IUserData,
      headers: res.headers,
    };
  } catch (err) {
    handleMiddlewareError(err, {
      context: { url, operation: 'bootstrap' },
    });
    return null;
  }
};

/**
 * Hashes a string using SHA-1 and returns hex-encoded string
 * @param str - String to hash
 * @returns Hex-encoded SHA-1 hash, or empty string if input is empty/error
 */
export const hash = async (str?: string) => {
  if (!str) {
    return '';
  }
  try {
    const buffer = await globalThis.crypto.subtle.digest('SHA-1', Buffer.from(str, 'utf-8'));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (err) {
    handleMiddlewareError(err, {
      context: { operation: 'hash' },
    });
    return '';
  }
};

/**
 * Middleware to initialize the session using the Sidecar Session pattern
 *
 * The Sidecar Session pattern enables session interoperability between different domains:
 * - Driver (Source of Truth): Flask Cookie (ads_session) - cryptographically signed by backend
 * - Sidecar (Cache): iron-session in Next.js - holds decrypted user data for fast access
 * - The Link: Hash of the Flask cookie (apiCookieHash) - used to detect cookie changes
 *
 * Flow:
 * 1. Check: Compare hash of incoming Flask cookie against cached hash
 * 2. Sync:
 *    - Match: Use cached data (0ms latency)
 *    - Mismatch/Missing: Call API bootstrap to get fresh token and update cache
 *
 * Cookie Security:
 * - Domain: Stripped (defaults to host-only for better security)
 * - SameSite: Forced to 'lax' (allows cross-site navigation while preventing CSRF)
 * - Secure/HttpOnly: Preserved from API
 *
 * @param req - The incoming request
 * @param res - The response to modify
 * @param session - The iron-session to update
 */
export const initSession = async (req: NextRequest, res: NextResponse, session: IronSession) => {
  log.debug({ session }, 'Initializing session');

  const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;
  const apiCookieHash = await hash(adsSessionCookie);

  log.debug('Incoming session found, validating...');

  // Check if the session is valid
  const isUserIdentifiedAsBot = session.bot && isValidToken(session.token);
  const hasRefreshTokenHeader = req.headers.has('x-refresh-token');
  const isTokenValid = isValidToken(session.token);
  const isApiCookieHashPresent = apiCookieHash !== '';
  const isApiCookieHashMatching = apiCookieHash === session.apiCookieHash;

  const isValidSession =
    isUserIdentifiedAsBot ||
    (!hasRefreshTokenHeader && isTokenValid && isApiCookieHashPresent && isApiCookieHashMatching);

  if (isValidSession) {
    log.debug('Session is valid.');
    return res;
  }

  log.debug('Session is invalid, or expired, creating new one...');

  // check if the user is a bot
  await botCheck(req, res);

  const testScenario = req.headers.get('x-test-scenario');
  const testHeaders = testScenario ? { 'x-test-scenario': testScenario } : undefined;

  // bootstrap a new token, passing in the current session cookie value
  const bootstrapResult = await bootstrap(adsSessionCookie, testHeaders);

  if (!bootstrapResult) {
    log.error({
      msg: 'Bootstrap failed, session will remain invalid',
      hasIncomingCookie: !!adsSessionCookie,
    });
    return res;
  }

  const { token, headers } = bootstrapResult;

  // validate token, update session, forward cookies
  if (isValidToken(token)) {
    log.debug('Refreshed token is valid');
    session.token = token;
    session.isAuthenticated = isAuthenticated(token);

    // Parse the Set-Cookie header from the API
    const setCookieHeader = headers.get('set-cookie');
    if (setCookieHeader) {
      const parsedCookies = setCookie.parse(setCookieHeader);
      const apiCookie = parsedCookies[0];

      if (apiCookie) {
        // Only update if the cookie value actually changed (prevents race conditions)
        const currentCookieValue = adsSessionCookie;
        const newCookieValue = apiCookie.value;

        if (currentCookieValue !== newCookieValue) {
          log.debug({
            msg: 'Cookie value changed, synchronizing',
            cookieChanged: true,
          });

          // Sanitize cookie attributes according to the Sidecar Session pattern
          res.cookies.set(process.env.ADS_SESSION_COOKIE_NAME, newCookieValue, {
            httpOnly: apiCookie.httpOnly ?? true,
            secure: apiCookie.secure ?? process.env.NODE_ENV === 'production',
            sameSite: apiCookie.sameSite === 'none' ? 'none' : 'lax',
            path: apiCookie.path ?? '/',
            maxAge: apiCookie.maxAge,
          });

          session.apiCookieHash = await hash(newCookieValue);
        } else {
          log.debug({
            msg: 'Cookie value unchanged, skipping sync',
            cookieChanged: false,
          });
          session.apiCookieHash = apiCookieHash;
        }
      }
    }

    await session.save();
    log.debug('Saved to session');
  } else {
    log.error({
      msg: 'Bootstrap returned invalid token',
      hasToken: !!token,
      tokenData: token ? { username: token.username, anonymous: token.anonymous } : null,
    });
  }
};
