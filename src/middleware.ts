// eslint-disable-next-line @next/next/no-server-import-in-page
import type { NextRequest } from 'next/server';
// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { ApiTargets } from '../src/api/models';
import { isNil, pick } from 'ramda';
import { IBootstrapPayload, IUserData } from '@api';
import { isPast, parseISO } from 'date-fns';
import { ADMIN_ROUTE_PREFIXES, sessionConfig } from '@config';

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  // get the current session
  const res = NextResponse.next();
  const session = await getIronSession(req, res, sessionConfig);

  // check if the token held in the session is valid, and the request has a session
  if (isValidToken(session.token) && req.cookies.has(process.env.ADS_SESSION_COOKIE_NAME)) {
    // if the user is authenticated, confirm route is available, if not redirect
    return hasAccessToRoute(req.nextUrl.pathname, session.isAuthenticated)
      ? res
      : NextResponse.redirect(new URL(`/user/account/login?redirectUri=${encodeURIComponent(req.url)}`, req.url));
  }

  // get the current session cookie (if available)
  const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;

  // bootstrap a new token, passing in the current session cookie value
  const { token, headers } = await bootstrap(adsSessionCookie);

  // validate token, update session, forward cookies
  if (isValidToken(token)) {
    session.token = token;
    session.isAuthenticated = isAuthenticated(token);
    res.headers.set('set-cookie', headers.get('set-cookie'));
    await session.save();

    // if the user is authenticated, confirm route is available, if not redirect
    return hasAccessToRoute(req.nextUrl.pathname, session.isAuthenticated)
      ? res
      : NextResponse.redirect(new URL(`/user/account/login?redirectUri=${encodeURIComponent(req.url)}`, req.url));
  }

  // TODO: what happens if bootstrap fails?
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
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

export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

const hasAccessToRoute = (route: string, isAuthenticated: boolean) =>
  isAuthenticated ? true : ADMIN_ROUTE_PREFIXES.every((prefix) => !route.startsWith(prefix));
