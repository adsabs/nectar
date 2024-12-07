import { sessionConfig } from '@/config';
import { initSession } from '@/middlewares/initSession';
import { verifyMiddleware } from '@/middlewares/verifyMiddleware';
import { getIronSession } from 'iron-session/edge';
import { edgeLogger } from '@/logger';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/rateLimit';

const log = edgeLogger.child({}, { msgPrefix: '[middleware] ' });

const redirect = (
  url: URL,
  req: NextRequest,
  options?: {
    message: string;
    clearParams?: boolean;
  },
) => {
  const clear = options?.clearParams ?? true;
  log.debug({ options, url: url.searchParams.toString() }, 'redirection');
  if (clear) {
    url.search = '';
    url.searchParams.forEach((_, key, search) => search.delete(key));
  }

  // clean the url of any existing notify params
  url.searchParams.delete('notify');
  if (options?.message) {
    url.searchParams.set('notify', options?.message);
  }
  return NextResponse.redirect(url, req);
};

const redirectIfAuthenticated = async (req: NextRequest, res: NextResponse) => {
  log.debug('Redirect if Authenticated Middleware');
  const session = await getIronSession(req, res, sessionConfig);

  // if the user is authenticated, redirect them to the root
  if (session.isAuthenticated) {
    const url = req.nextUrl.clone();
    log.debug({ msg: 'User is authenticated, redirecting to home', url });
    url.pathname = '/';
    return redirect(url, req);
  }
  return res;
};

const loginMiddleware = async (req: NextRequest, res: NextResponse) => {
  log.debug('Login middleware');
  const session = await getIronSession(req, res, sessionConfig);

  if (session.isAuthenticated) {
    log.debug('User is authenticated, checking for presence of next param');

    const next = req.nextUrl.searchParams.get('next');
    if (next) {
      log.debug({
        msg: 'Next param found',
        nextParam: next,
      });
      const nextUrl = new URL(decodeURIComponent(next), req.nextUrl.origin);
      const url = req.nextUrl.clone();
      if (nextUrl.origin !== url.origin) {
        log.debug('Next param is external, redirecting to root');
        url.searchParams.delete('next');
        url.pathname = '/';
        return redirect(url, req, { message: 'account-login-success' });
      }

      log.debug('Next param is relative, redirecting to it');
      url.searchParams.delete('next');
      url.pathname = nextUrl.pathname;
      return redirect(url, req, { message: 'account-login-success' });
    }

    log.debug('No next param found, redirecting to root');
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, req);
  }

  log.debug('User is not authenticated, proceeding to login page');
  return res;
};

const protectedRoute = async (req: NextRequest, res: NextResponse) => {
  log.debug('Accessing protected route');
  const session = await getIronSession(req, res, sessionConfig);
  if (session.isAuthenticated) {
    log.debug('User is authenticated, proceeding');
    return res;
  }
  log.debug('User is not authenticated, redirecting to login');
  const url = req.nextUrl.clone();
  const originalPath = url.pathname;
  url.pathname = '/user/account/login';
  url.searchParams.set('next', encodeURIComponent(originalPath));
  return redirect(url, req, { message: 'login-required', clearParams: false });
};

/**
 * Sends an analytics event for specific routes to a designated link gateway.
 *
 * If the request's path starts with '/abs', an event is sent to the link gateway with
 * the adjusted path. Otherwise, no event is sent.
 *
 * @param {NextRequest} req - The request object containing the URL information.
 * @returns {Promise<void>} - A promise that resolves when the operation completes,
 * either successfully or with an error.
 */
const emitAnalytics = async (req: NextRequest): Promise<void> => {
  const path = req.nextUrl.pathname;

  // For abs/ routes we want to send emit an event to the link gateway
  if (path.startsWith('/abs')) {
    const url = `${process.env.BASE_URL}/link_gateway${path.replace('/abs', '')}`;
    log.debug({ path, url }, 'Emitting abs route event to link gateway');

    try {
      await fetch(url, { method: 'GET' });
      log.debug('Event successfully sent to link gateway');
    } catch (err) {
      log.error({ err: err as Error }, 'Error sending event to link gateway');
    }
  }
  return Promise.resolve();
};

const getIp = (req: NextRequest) =>
  (
    req.headers.get('X-Original-Forwarded-For') ||
    req.headers.get('X-Forwarded-For') ||
    req.headers.get('X-Real-Ip') ||
    ''
  )
    .split(',')
    .shift() || 'unknown';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  log.info(
    {
      method: req.method,
      url: req.nextUrl.toString(),
      path,
    },
    'Request',
  );

  const res = NextResponse.next();

  // Emit analytics
  void emitAnalytics(req);

  // Skip middleware for some paths
  if (path === '/' || path.startsWith('/_next/data')) {
    return res;
  }

  const ip = getIp(req);

  // Apply rate limiting
  if (!rateLimit(ip)) {
    log.warn({ msg: 'Rate limit exceeded', ip });
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, req, { message: 'rate-limit-exceeded' });
  }

  const session = await getIronSession(req, res, sessionConfig);
  await initSession(req, res, session);

  if (!session.token) {
    log.error('Failed to create a new session, redirecting back to root');
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, req, { message: 'api-connect-failed' });
  }

  if (path.startsWith('/user/account/login')) {
    return loginMiddleware(req, res);
  }

  if (path.startsWith('/user/account/register') || path.startsWith('/user/forgotpassword')) {
    return redirectIfAuthenticated(req, res);
  }

  if (path.startsWith('/user/libraries') || path.startsWith('/user/settings')) {
    return protectedRoute(req, res);
  }

  if (path.startsWith('/user/account/verify/change-email') || path.startsWith('/user/account/verify/register')) {
    return verifyMiddleware(req, res);
  }

  log.debug({ msg: 'Non-special route, continuing', res });
  return res;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|light|dark|_next/image|favicon|android|images|mockServiceWorker|site.webmanifest|error|feedback|classic-form|paper-form).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
    '/api/user',
  ],
};
