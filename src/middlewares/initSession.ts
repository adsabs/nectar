import { IronSession } from 'iron-session';
import { ApiTargets } from '@/api/models';
import { IBootstrapPayload, IUserData } from '@/api/user/types';
import { isNil, pick } from 'ramda';
import { isPast, parseISO } from 'date-fns';
import { edgeLogger } from '@/logger';
//  eslint-disable-next-line @next/next/no-server-import-in-page
import { NextRequest, NextResponse } from 'next/server';
import setCookie from 'set-cookie-parser';

/**
 * Checks if the user data is valid
 * @param userData
 */
const isUserData = (userData?: IUserData): userData is IUserData =>
  !isNil(userData) &&
  typeof userData.access_token === 'string' &&
  typeof userData.expire_in === 'string' &&
  userData.access_token.length > 0 &&
  userData.expire_in.length > 0;

/**
 * Checks if the token is valid
 * @param userData
 */
const isValidToken = (userData?: IUserData): boolean => isUserData(userData) && !isPast(parseISO(userData.expire_in));

/**
 * Checks if the user is authenticated
 * @param user
 */
const isAuthenticated = (user: IUserData) => isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

/**
 * Bootstraps the session (to get a new token)
 * @param cookie
 */
const bootstrap = async (cookie?: string) => {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    return {
      token: {
        access_token: 'mocked',
        username: 'mocked',
        anonymous: false,
        expire_in: 'mocked',
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
  try {
    log.debug('Bootstrapping');
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    const json = (await res.json()) as IBootstrapPayload;
    log.debug({
      msg: 'Bootstrap successful',
      payload: json,
    });
    return {
      token: pick(['access_token', 'username', 'anonymous', 'expire_in'], json) as IUserData,
      headers: res.headers,
    };
  } catch (error) {
    log.error({
      msg: 'Bootstrapping failed',
      error,
    });
    return null;
  }
};

/**
 * Hashes a string using SHA-1
 * @param str
 */
const hash = async (str?: string) => {
  if (!str) {
    return '';
  }
  try {
    const buffer = await globalThis.crypto.subtle.digest('SHA-1', Buffer.from(str, 'utf-8'));
    return Array.from(new Uint8Array(buffer)).toString();
  } catch (e) {
    return '';
  }
};

const log = edgeLogger.child({}, { msgPrefix: '[initSession] ' });

/**
 * Middleware to initialize the session
 * @param req
 * @param res
 */
export const initSession = async (req: NextRequest, res: NextResponse, session: IronSession) => {
  log.debug('Initializing session');
  const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;
  const apiCookieHash = await hash(adsSessionCookie);

  log.debug('Incoming session found, validating...');

  // if the session is valid, do not bootstrap
  if (
    // if the user has already been identified as a bot, we don't need to re-bootstrap
    (session.bot && isValidToken(session.token)) ||
    // check if the refresh token is present, meaning we want to force a new session
    (!req.headers.has('X-Refresh-Token') &&
      // check if the token is valid
      isValidToken(session.token) &&
      // check if the cookie hash matches the one in the session
      apiCookieHash !== null &&
      // the incoming cookie hash matches the one in the session
      apiCookieHash === session.apiCookieHash)
  ) {
    log.debug('Session is valid.');
    return res;
  }
  log.debug('Session is invalid, or expired, creating new one...');

  // check if the user is a bot
  // await botCheck(req, res);

  // bootstrap a new token, passing in the current session cookie value
  const { token, headers } = (await bootstrap(adsSessionCookie)) ?? {};

  // validate token, update session, forward cookies
  if (isValidToken(token)) {
    session.token = token;
    session.isAuthenticated = isAuthenticated(token);
    log.debug({ msg: 'headers', headers: headers.entries() });
    const sessionCookieValue = setCookie.parse(headers.get('set-cookie') ?? '')[0].value;
    res.cookies.set(process.env.ADS_SESSION_COOKIE_NAME, sessionCookieValue);
    session.apiCookieHash = await hash(res.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value);
    await session.save();
  }
};
