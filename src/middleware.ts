// eslint-disable-next-line @next/next/no-server-import-in-page
import type { NextRequest } from 'next/server';
// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextResponse, userAgent } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { ApiTargets } from '../src/api/models';
import { equals, isNil, pick } from 'ramda';
import { IBootstrapPayload, IUserData, IVerifyAccountResponse } from '@api';
import { isPast, parseISO } from 'date-fns';
import { AUTH_EXCEPTIONS, PROTECTED_ROUTES, sessionConfig } from '@config';
import { IronSession } from 'iron-session';
import { logger } from '../logger/logger';

const log = logger.child({ module: 'middleware' });

const logRequest = (req: NextRequest) => {
  log.info({
    method: req.method,
    url: req.nextUrl.toString(),
    headers: req.headers,
    cookies: req.cookies,
    body: req.body,
  });
};

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  logRequest(req);
  log.info({ msg: 'IP address', ip: req.ip });

  if (req.nextUrl.pathname.startsWith('/monitor')) {
    return handleMonitorResponse(req);
  }

  // get the current session
  const res = NextResponse.next();
  const session = await getIronSession(req, res, sessionConfig);
  const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;
  const apiCookieHash = await hash(adsSessionCookie);
  const refresh = req.headers.has('x-RefreshToken');

  log.info({
    url: req.nextUrl.toString(),
    session,
    adsSessionCookie,
    apiCookieHash,
    refresh,
    hasAccessToRoute: hasAccessToRoute(req.nextUrl.pathname, session.isAuthenticated),
  });

  // verify requests need to be handled separately
  if (req.nextUrl.pathname.startsWith('/user/account/verify')) {
    return handleVerifyResponse(req, res, session);
  }

  // check if the token held in the session is valid, and the request has a session
  if (
    !session.bot &&
    !refresh &&
    isValidToken(session.token) &&
    // check if the cookie hash matches the one in the session
    apiCookieHash !== null &&
    equals(apiCookieHash, session.apiCookieHash)
  ) {
    log.info({
      msg: 'session is valid, continuing',
    });
    return handleResponse(req, res, session);
  }

  // if the request is from a bot, we need to handle it differently
  if (req.ip) {
    log.info({
      msg: 'session is invalid, checking if request is from a crawler',
      session,
      refresh,
      hasAccessToRoute: hasAccessToRoute(req.nextUrl.pathname, session.isAuthenticated),
    });
    const crawlerResult = await crawlerCheck(req);
    if (crawlerResult !== CRAWLER_RESULT.HUMAN) {
      return handleBotResponse({ req, res, session, crawlerResult });
    }
  } else if (userAgent(req).isBot) {
    log.info({ msg: 'request has a known bot useragent string, but no IP, so unable to verify' });
    return handleBotResponse({ req, res, session, crawlerResult: CRAWLER_RESULT.UNVERIFIABLE });
  }
  log.info({ msg: 'request is from a human' });

  // bootstrap a new token, passing in the current session cookie value
  const { token, headers } = (await bootstrap(adsSessionCookie)) ?? {};

  log.info({
    msg: 'bootstrap result',
    token,
    headers,
  });

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
    '/((?!api|_next/static|_next/image|favicon|android|images|mockServiceWorker|site.webmanifest).*)',
    '/api/user',
    '/',
  ],
};

const hash = async (str?: string) => {
  if (!str) {
    return null;
  }
  try {
    const buffer = await globalThis.crypto.subtle.digest('SHA-1', Buffer.from(str, 'utf-8'));
    return Array.from(new Uint8Array(buffer));
  } catch (e) {
    return null;
  }
};

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

enum CRAWLER_RESULT {
  BOT,
  HUMAN,
  POTENTIAL_MALICIOUS_BOT,
  UNVERIFIABLE,
}

const crawlerCheck = async (req: NextRequest) => {
  const res = await fetch(new URL('/api/isBot', req.nextUrl), {
    method: 'POST',
    body: JSON.stringify({
      ua: userAgent(req).ua,
      ip: req.ip,
    }),
  });
  return (await res.json()) as CRAWLER_RESULT;
};

const handleBotResponse = async ({
  req,
  res,
  session,
  crawlerResult,
}: {
  req: NextRequest;
  res: NextResponse;
  session: IronSession;
  crawlerResult: CRAWLER_RESULT;
}) => {
  const ua = userAgent(req).ua;
  if (crawlerResult === CRAWLER_RESULT.BOT) {
    log.info({
      msg: 'request is from a bot, applying token',
      result: crawlerResult,
      ua,
      ip: req.ip,
    });
    session.token = {
      access_token: process.env.VERIFIED_BOTS_ACCESS_TOKEN,
      anonymous: true,
      expire_in: '9999-01-01T00:00:00',
      username: 'anonymous',
    };
  } else if (crawlerResult === CRAWLER_RESULT.UNVERIFIABLE) {
    log.info({
      msg: 'request is from an unverifiable bot, applying token',
      result: crawlerResult,
      ua,
      ip: req.ip,
    });
    session.token = {
      access_token: process.env.UNVERIFIABLE_BOTS_ACCESS_TOKEN,
      anonymous: true,
      expire_in: '9999-01-01T00:00:00',
      username: 'anonymous',
    };
  } else if (crawlerResult === CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT) {
    log.info({
      msg: 'request is from a potential malicious bot, applying token',
      result: crawlerResult,
      ua,
      ip: req.ip,
    });
    session.token = {
      access_token: process.env.MALICIOUS_BOTS_ACCESS_TOKEN,
      anonymous: true,
      expire_in: '9999-01-01T00:00:00',
      username: 'anonymous',
    };
  }
  session.isAuthenticated = false;
  session.apiCookieHash = [];
  session.bot = true;
  await session.save();

  return handleResponse(req, res, session);
};

const handleResponse = (req: NextRequest, res: NextResponse, session: IronSession) => {
  const pathname = req.nextUrl.pathname;
  const authenticated = isAuthenticated(session.token);

  // If the user is authenticated, and they are on the login page, redirect them to the root
  if (pathname === '/user/account/login' && authenticated) {
    const next = req.nextUrl.searchParams.get('next');
    if (next) {
      // if there is a next param, redirect to it
      const url = new URL(decodeURIComponent(next), req.nextUrl.origin);

      // this url MUST be relative, otherwise we should redirect to root
      if (url.origin !== req.nextUrl.origin) {
        // url is external, ignore it and redirect to root
        const url = req.nextUrl.clone();
        url.searchParams.delete('next');
        url.pathname = '/';
        return redirect(url, res, 'account-login-success');
      }

      // if the url is relative, redirect to it
      return redirect(url, res, 'account-login-success');
    } else {
      // otherwise redirect to root
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return redirect(url, res, 'account-login-success');
    }
  }

  // request is authenticated, cannot access register
  if (pathname === '/user/account/register' && authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, res);
  }

  // request is not authenticated, but the user is trying to access a protected route
  if (
    !authenticated &&
    pathname !== '/user/account/login' &&
    pathname !== '/user/account/register' &&
    pathname.startsWith('/user')
  ) {
    const url = req.nextUrl.clone();
    url.pathname = '/user/account/login';
    url.searchParams.set('next', encodeURIComponent(pathname));
    return redirect(url, res, 'login-required');
  }

  return res;
};

const handleVerifyResponse = async (req: NextRequest, res: NextResponse, session: IronSession) => {
  // verify requests have a token we need to send to the API
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
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, res, 'verify-token-invalid');
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
      authorization: `Bearer ${session.token.access_token}`,
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
      newUrl.pathname = '/user/account/login';
      return redirect(newUrl, res, 'verify-account-success');
    }

    // known error messages
    if (json?.error.indexOf('unknown verification token') > -1) {
      return redirect(newUrl, res, 'verify-account-failed');
    }

    if (json?.error.indexOf('already been validated') > -1) {
      return redirect(newUrl, res, 'verify-account-was-valid');
    }

    // unknown error
    return redirect(newUrl, res, 'verify-account-failed');
  } catch (e) {
    return redirect(newUrl, res, 'verify-account-failed');
  }
};

const redirect = (url: URL, res: NextResponse, message?: string) => {
  if (message) {
    url.searchParams.set('notify', message);
  }
  return NextResponse.redirect(url, { status: 307, ...res });
};

// Sentry.io tunneling
const SENTRY_HOST = 'o1060269.ingest.sentry.io';
const SENTRY_PROJECT_IDS = ['6049652'];
const handleMonitorResponse = async (req: NextRequest) => {
  try {
    const envelope = await req.text();
    const piece = envelope.split('\n')[0];
    const header = JSON.parse(piece) as Record<string, string>;
    const dsn = new URL(header['dsn']);
    const project_id = dsn.pathname?.replace('/', '');

    if (dsn.hostname !== SENTRY_HOST) {
      throw new Error(`Invalid sentry hostname: ${dsn.hostname}`);
    }

    if (!project_id || !SENTRY_PROJECT_IDS.includes(project_id)) {
      throw new Error(`Invalid sentry project id: ${project_id}`);
    }

    const upstream_sentry_url = `https://${SENTRY_HOST}/api/${project_id}/envelope/`;
    await fetch(upstream_sentry_url, { method: 'POST', body: envelope });

    return NextResponse.json({ status: 200 });
  } catch (e) {
    log.error({
      msg: 'error tunneling to sentry',
      error: e,
    });
    return NextResponse.json({ error: 'error tunneling to sentry' }, { status: 500 });
  }
};
