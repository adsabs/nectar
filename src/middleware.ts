// eslint-disable-next-line @next/next/no-server-import-in-page
import type { NextRequest } from 'next/server';
// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { ApiTargets } from '../src/api/models';
import { equals, isNil, pick } from 'ramda';
import { IBootstrapPayload, IUserData, IVerifyAccountResponse } from '@api';
import { isPast, parseISO } from 'date-fns';
import { AUTH_EXCEPTIONS, PROTECTED_ROUTES, sessionConfig } from '@config';
import { IronSession } from 'iron-session';

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  // get the current session
  const res = NextResponse.next();
  const session = await getIronSession(req, res, sessionConfig);
  const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;
  const apiCookieHash = await hash(adsSessionCookie);
  const refresh = req.headers.has('x-RefreshToken');

  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE]', req.nextUrl.href);
    console.log('session', session);
    console.log('incomingSessionCookie', adsSessionCookie);
    console.log('apiCookieHash', apiCookieHash);
    console.log('refresh', refresh);
    console.log('hasAccessToRoute', hasAccessToRoute(req.nextUrl.pathname, session.isAuthenticated));
  }

  // verify requests need to be handled separately
  if (req.nextUrl.pathname.startsWith('/user/account/verify')) {
    return handleVerifyResponse(req, res, session);
  }

  // check if the token held in the session is valid, and the request has a session
  if (
    !refresh &&
    isValidToken(session.token) &&
    // check if the cookie hash matches the one in the session
    apiCookieHash !== null &&
    equals(apiCookieHash, session.apiCookieHash)
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[VALID]: reusing session');
    }
    return handleResponse(req, res, session);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[INVALID]: bootstrapping');
  }

  // bootstrap a new token, passing in the current session cookie value
  const { token, headers } = (await bootstrap(adsSessionCookie)) ?? {};

  // validate token, update session, forward cookies
  if (isValidToken(token)) {
    session.token = token;
    session.isAuthenticated = isAuthenticated(token);
    session.apiCookieHash = await hash(
      // grab only the value of the cookie, not the name or the metadata
      headers
        .get('set-cookie')
        .slice(process.env.ADS_SESSION_COOKIE_NAME.length + 1)
        .split(';')[0],
    );
    res.headers.set('set-cookie', headers.get('set-cookie'));
    await session.save();

    return handleResponse(req, res, session);
  }

  // if bootstrapping fails, we should probably redirect back to root and show a message
  const url = req.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('notify', 'api-connect-failed');
  return NextResponse.redirect(url, { status: 307, ...res });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon|android|site.webmanifest).*)',
    '/api/user',
    '/',
  ],
};

const hash = async (str?: string) => {
  if (!str) {
    return null;
  }
  const buffer = await crypto.subtle.digest('SHA-1', Buffer.from(str, 'utf-8'));
  return Array.from(new Uint8Array(buffer));
};

const bootstrap = async (cookie?: string) => {
  const url = `${process.env.API_HOST_SERVER}${ApiTargets.BOOTSTRAP}`;
  const headers = new Headers();

  // use the incoming session cookie to perform the bootstrap
  if (cookie) {
    headers.append('cookie', `${process.env.ADS_SESSION_COOKIE_NAME}=${cookie}`);
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    const json = (await res.json()) as IBootstrapPayload;
    return {
      token: pick(['access_token', 'username', 'anonymous', 'expire_in'], json) as IUserData,
      headers: res.headers,
    };
  } catch (e) {
    return null;
  }
};

const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

const isValidToken = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isPast(parseISO(userData.expire_in));
};

const isAuthenticated = (user: IUserData) => isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

const checkPrefix = (route: string) => (prefix: string) => !route.startsWith(prefix);
const hasAccessToRoute = (route: string, isAuthenticated: boolean) => {
  return isAuthenticated ? AUTH_EXCEPTIONS.every(checkPrefix(route)) : PROTECTED_ROUTES.every(checkPrefix(route));
};

const handleResponse = (req: NextRequest, res: NextResponse, session: IronSession) => {
  const pathname = req.nextUrl.pathname;
  const authenticated = isAuthenticated(session.token);

  if (hasAccessToRoute(pathname, authenticated)) {
    return res;
  }

  const url = req.nextUrl.clone();

  // if on any of the account pages, redirect to root
  if (pathname.startsWith('/user/account') || pathname.startsWith('/user/settings')) {
    url.pathname = '/';
    return NextResponse.redirect(url, { status: 307, ...res });
  }

  // otherwise redirect to login
  url.pathname = '/user/account/login';
  url.searchParams.set('redirectUri', encodeURIComponent(pathname));
  return NextResponse.redirect(url, { status: 307, ...res });
};

const handleVerifyResponse = async (req: NextRequest, res: NextResponse, session: IronSession) => {
  // verify requests have an token we need to send to the API
  try {
    const [, , , , route, token] = req.nextUrl.pathname.split('/');

    if (route === 'change-email' || route === 'register') {
      // we need to verify the token, and then pass the authenticated session to home page.
      // the middleware should run on the home page and bootstrap the session
      return await verify({ token, session, res, req });
    } else if (route === 'reset-password') {
      // reset password needs to prompt for a new password, allow the request to continue
      return res;
    }
  } catch (e) {
    return NextResponse.redirect(new URL('/', req.url), res);
  }
};

const verify = async (options: { token: string; req: NextRequest; res: NextResponse; session: IronSession }) => {
  const { req, res, session, token } = options;
  // get a new url ready to go, we'll redirect with a message depending on status
  const newUrl = req.nextUrl.clone();
  newUrl.pathname = '/';

  try {
    const url = `${process.env.API_HOST_SERVER}${ApiTargets.VERIFY}/${token}`;
    const headers = new Headers({
      authorization: `Bearer:${session.token.access_token}`,
      cookie: `${process.env.ADS_SESSION_COOKIE_NAME}=${req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value}`,
    });

    const result = await fetch(url, {
      method: 'GET',
      headers,
    });

    const json = (await result.json()) as IVerifyAccountResponse;

    if (json.message === 'success') {
      // apply the session cookie to the response
      res.headers.set('set-cookie', result.headers.get('set-cookie'));

      newUrl.searchParams.set('notify', 'verify-account-success');
      return NextResponse.redirect(newUrl, { status: 307, ...res });
    }

    // known error messages
    if (json?.error.indexOf('unknown verification token') > -1) {
      newUrl.searchParams.set('notify', 'verify-account-failed');
      return NextResponse.redirect(newUrl, { status: 307, ...res });
    }

    if (json?.error.indexOf('already been validated') > -1) {
      newUrl.searchParams.set('notify', 'verify-account-was-valid');
      return NextResponse.redirect(newUrl, { status: 307, ...res });
    }

    // unknown error
    return NextResponse.redirect(newUrl, { status: 307, ...res });
  } catch (e) {
    newUrl.searchParams.set('notify', 'verify-account-was-valid');
    return NextResponse.redirect(newUrl, { status: 307, ...res });
  }
};
