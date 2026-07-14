import { sessionConfig, TRACING_HEADERS } from '@/config';
import { initSession } from '@/middlewares/initSession';
import { verifyMiddleware } from '@/middlewares/verifyMiddleware';
import { getIronSession } from 'iron-session/edge';
import { edgeLogger } from '@/logger';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMIT_RETRY_AFTER_SECONDS } from '@/rateLimit';
import { isLegacySearchURL, legacySearchURLMiddleware } from '@/middlewares/legacySearchURLMiddleware';
import { ErrorSource, handleError } from '@/lib/errorHandler.edge';
import { getUserLogId, sanitizeHeaderValue } from '@/utils/logging';
import { mapDisciplineParamToAppMode, mapPathToDisciplineParam } from '@/utils/appMode';
import { AppMode } from '@/types';
import { isFromLegacyApp } from '@/utils/legacyAppDetection';
import { pickTracingHeadersEdge } from '@/utils/tracing.edge';

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
  if (clear) {
    url.search = '';
    url.searchParams.forEach((_, key, search) => search.delete(key));
  }

  // clean the url of any existing notify params
  url.searchParams.delete('notify');
  if (options?.message) {
    url.searchParams.set('notify', options?.message);
  }

  log.info(
    {
      from: req.nextUrl.pathname,
      to: url.pathname,
      message: options?.message,
      clearParams: clear,
    },
    'Redirect',
  );

  return NextResponse.redirect(url, req);
};

// Minimal self-contained 429 page for document navigations — edge responses
// can't use the app shell. Only renders for hard loads that trip the limiter
// (bots, refresh-under-throttle). Authenticated users skip the account nudge.
const rateLimitHtml = (isAuthenticated: boolean) => {
  const body = isAuthenticated
    ? 'You&rsquo;ve made too many requests. Please try again later.'
    : 'You&rsquo;ve made too many requests. <a href="/user/account/register">Create a free account</a> for higher limits, or try again later.';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rate limit reached</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; display: grid;
    place-items: center; min-height: 100vh; padding: 1.5rem; color: #1a202c; }
  main { max-width: 32rem; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
  a { color: #3182ce; }
</style>
</head>
<body>
<main>
<h1>Rate limit reached</h1>
<p>${body}</p>
</main>
</body>
</html>`;
};

// Real HTTP 429 for the node limiter instead of redirecting home, so it shares
// the client 429 path with upstream API 429s. Document navigations get a
// readable page; XHRs get JSON the client parses. Both carry the real status
// and Retry-After.
const tooManyRequests = async (req: NextRequest) => {
  const headers = { 'Retry-After': String(RATE_LIMIT_RETRY_AFTER_SECONDS) };

  if (req.headers.get('accept')?.includes('text/html')) {
    // Read the session only for the page copy (rare path); XHRs skip it.
    const session = await getIronSession(req, NextResponse.next(), sessionConfig);
    return new NextResponse(rateLimitHtml(session.isAuthenticated), {
      status: 429,
      headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return NextResponse.json({ message: 'rate-limit-exceeded' }, { status: 429, headers });
};

const redirectIfAuthenticated = async (req: NextRequest, res: NextResponse) => {
  const session = await getIronSession(req, res, sessionConfig);

  // if the user is authenticated, redirect them to the root
  if (session.isAuthenticated) {
    log.info(
      {
        path: req.nextUrl.pathname,
        userId: await getUserLogId(session.token?.username),
        authenticated: session.isAuthenticated,
      },
      'Auth exception route - user authenticated, redirecting to home',
    );
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, req);
  }
  log.debug({ path: req.nextUrl.pathname }, 'Auth exception route - user not authenticated, continuing');
  return res;
};

const loginMiddleware = async (req: NextRequest, res: NextResponse) => {
  const session = await getIronSession(req, res, sessionConfig);

  if (session.isAuthenticated) {
    const next = req.nextUrl.searchParams.get('next');
    if (next) {
      const nextUrl = new URL(decodeURIComponent(next), req.nextUrl.origin);
      const url = req.nextUrl.clone();
      if (nextUrl.origin !== url.origin) {
        log.warn(
          {
            nextParam: next,
            nextOrigin: nextUrl.origin,
            currentOrigin: url.origin,
            userId: await getUserLogId(session.token?.username),
          },
          'Login - external next param rejected',
        );
        url.searchParams.delete('next');
        url.pathname = '/';
        return redirect(url, req, { message: 'account-login-success' });
      }

      log.info(
        {
          nextParam: next,
          userId: await getUserLogId(session.token?.username),
        },
        'Login - authenticated user, redirecting to next param',
      );
      url.searchParams.delete('next');
      url.pathname = nextUrl.pathname;
      return redirect(url, req, { message: 'account-login-success' });
    }

    log.info(
      {
        userId: await getUserLogId(session.token?.username),
        authenticated: session.isAuthenticated,
      },
      'Login - authenticated user, redirecting to home',
    );
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, req);
  }

  log.debug('Login - user not authenticated, showing login page');
  return res;
};

export const normalizeAbsPath = (
  pathname: string,
): { shouldRewrite: boolean; rewrittenPath?: string; rawIdentifier?: string; view?: string } => {
  if (!pathname.startsWith('/abs/')) {
    return { shouldRewrite: false };
  }

  const parts = pathname.split('/').filter(Boolean); // ['abs', 'id', '...view']
  if (parts.length < 2) {
    return { shouldRewrite: false };
  }

  const knownViews = new Set([
    'abstract',
    'citations',
    'references',
    'credits',
    'mentions',
    'coreads',
    'similar',
    'graphics',
    'metrics',
    'toc',
    'exportcitation',
  ]);

  let view = 'abstract';
  let idSegments: string[] = [];
  const hasEncodedId = parts.some((segment, idx) => idx > 0 && /%2F/i.test(segment));

  if (parts.length >= 3 && parts[parts.length - 2] === 'exportcitation') {
    view = `exportcitation/${parts[parts.length - 1]}`;
    idSegments = parts.slice(1, -2);
  } else {
    const viewCandidate = parts[parts.length - 1];
    const hasKnownView = knownViews.has(viewCandidate);

    if (!hasKnownView) {
      view = 'abstract';
      if (hasEncodedId) {
        idSegments = parts.length > 2 ? parts.slice(1, -1) : parts.slice(1);
      } else if (parts.length === 3) {
        idSegments = parts.slice(1); // treat as no explicit view, keep both segments
      } else if (parts.length > 3) {
        // Keep all segments: there is no reliable way to distinguish an unknown
        // view token from a legitimate DOI suffix component. Preserving the full
        // identifier is safer — a 404 for a bad DOI is better than silently
        // routing to the wrong paper.
        idSegments = parts.slice(1);
      } else {
        idSegments = parts.slice(1);
      }
    } else {
      view = viewCandidate;
      idSegments = parts.slice(1, -1);
      if (idSegments.length <= 1) {
        return { shouldRewrite: false };
      }
    }
  }

  if (idSegments.length <= 1 && !hasEncodedId) {
    return { shouldRewrite: false };
  }

  const rawIdentifier = idSegments.join('/');
  // Decode first to avoid double-encoding any %-sequences already present in the
  // path (e.g. %3C/%3E for < and > in a DOI), then re-encode cleanly.
  const safeDecoded = (() => {
    try {
      return decodeURIComponent(rawIdentifier);
    } catch {
      return rawIdentifier;
    }
  })();
  const encodedIdentifier = hasEncodedId ? rawIdentifier : encodeURIComponent(safeDecoded);
  const rewrittenPath = `/abs/${encodedIdentifier}/${view}`;

  return { shouldRewrite: true, rewrittenPath, rawIdentifier, view };
};

export const rewriteAbsIdentifier = (req: NextRequest) => {
  try {
    const { shouldRewrite, rewrittenPath, rawIdentifier, view } = normalizeAbsPath(req.nextUrl.pathname);

    if (!shouldRewrite || !rewrittenPath) {
      return null;
    }

    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = rewrittenPath;

    log.info(
      {
        rawIdentifier,
        view,
        originalPath: req.nextUrl.pathname,
        rewrittenPath: rewrittenUrl.pathname,
      },
      'Abs path rewrite',
    );

    return NextResponse.rewrite(rewrittenUrl);
  } catch (error) {
    log.error({ err: error, pathname: req.nextUrl.pathname }, 'Abs path rewrite failed');
    handleError(error, {
      source: ErrorSource.MIDDLEWARE,
      context: { pathname: req.nextUrl.pathname },
      tags: { feature: 'abs-canonical', stage: 'rewrite' },
    });
    return null;
  }
};

const protectedRoute = async (req: NextRequest, res: NextResponse) => {
  const session = await getIronSession(req, res, sessionConfig);
  if (session.isAuthenticated) {
    log.debug(
      {
        path: req.nextUrl.pathname,
        userId: await getUserLogId(session.token?.username),
      },
      'Protected route - authenticated, proceeding',
    );
    return res;
  }
  log.info(
    {
      path: req.nextUrl.pathname,
    },
    'Protected route - not authenticated, redirecting to login',
  );
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
  if (path.startsWith('/abs') && process.env.BASE_URL) {
    const url = `${process.env.BASE_URL}/link_gateway${path.replace('/abs', '')}`;
    log.debug({ path, analyticsUrl: url }, 'Emitting abs route analytics event');

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: pickTracingHeadersEdge(req.headers),
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        log.debug({ path, analyticsUrl: url, duration, status: response.status }, 'Analytics event sent successfully');
      } else {
        log.warn(
          { path, analyticsUrl: url, duration, status: response.status },
          'Analytics event returned non-2xx status',
        );
      }
    } catch (err) {
      log.error({ err, path, analyticsUrl: url }, 'Failed to send analytics event');
      handleError(err, {
        source: ErrorSource.MIDDLEWARE,
        context: { path, url },
        tags: { feature: 'abs-canonical', stage: 'emit-analytics' },
      });
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

const PREFS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const setPrefsCookie = (response: NextResponse, req: NextRequest, updates: Record<string, unknown>): void => {
  let existing: Record<string, unknown> = {};
  try {
    const raw = req.cookies.get('scix_prefs')?.value;
    if (raw) {
      existing = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    }
  } catch {
    // ignore malformed cookie
  }
  const merged = { ...existing, ...updates };
  Object.keys(merged).forEach((k) => merged[k] === undefined && delete merged[k]);
  response.cookies.set('scix_prefs', JSON.stringify(merged), {
    maxAge: PREFS_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};

// The whole auth/account surface is exempt from the node limiter: login,
// register, forgotpassword, and the emailed verify/reset flows are all
// low-volume, account-critical navigations we point rate-limited users to.
// /api/user is the session endpoint the app needs to function at all. A DoS
// backstop shouldn't gate its own escape hatch, and it only exempts these page
// navigations — the /v1 API calls they fire stay limited.
export const isRateLimitExempt = (path: string): boolean =>
  path.startsWith('/user/account/') || path.startsWith('/api/user');

export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const path = req.nextUrl.pathname;
  const ip = getIp(req);
  const userAgent = sanitizeHeaderValue(req.headers.get('user-agent')) || 'unknown';
  const referer = req.headers.get('referer') || '';
  const tracingHeaders = TRACING_HEADERS.reduce((acc, key) => {
    const value = req.headers.get(key);
    if (value) {
      acc[key] = sanitizeHeaderValue(value);
    }
    return acc;
  }, {} as Record<string, string>);

  log.info(
    {
      method: req.method,
      url: req.nextUrl.toString(),
      path,
      ip,
      userAgent,
      referer,
      tracing: tracingHeaders,
    },
    'Request received',
  );

  const maybeAbsRewrite = rewriteAbsIdentifier(req);
  if (maybeAbsRewrite) {
    log.info({ path, duration: Date.now() - startTime }, 'Abs path rewrite applied');
    return maybeAbsRewrite;
  }

  // Discipline route handling - redirect /astrophysics, /heliophysics, etc. to /?forceMode=X
  // Also stamp the prefs cookie so SSR can seed the mode on subsequent pages without a forceMode param.
  const disciplineParam = mapPathToDisciplineParam(path);
  if (disciplineParam) {
    const url = new URL('/', req.url);
    url.searchParams.set('forceMode', disciplineParam);
    log.info({ path, disciplineParam, duration: Date.now() - startTime }, 'Discipline route redirect');
    const response = NextResponse.redirect(url);
    const mappedMode = mapDisciplineParamToAppMode(disciplineParam);
    if (mappedMode) {
      const updates: Record<string, unknown> = { mode: mappedMode };
      if (mappedMode !== AppMode.ASTROPHYSICS) {
        updates.searchMode = undefined; // clear ADS_COMPAT when not in astrophysics context
      }
      setPrefsCookie(response, req, updates);
    }
    return response;
  }

  // Legacy ADS app referrer handling - redirect to /?fromADS=true and set scix_prefs cookie
  // so updateUserStateSSR seeds mode/searchMode without URL pollution.
  // Guard includes fromADS to prevent a redirect loop: some browsers preserve the Referer
  // header across same-origin redirects, which would re-trigger this block on the follow-up GET.
  if (path === '/' && !req.nextUrl.searchParams.has('forceMode') && !req.nextUrl.searchParams.has('fromADS')) {
    if (isFromLegacyApp(referer)) {
      const url = new URL('/', req.url);
      url.searchParams.set('fromADS', 'true');
      log.info({ referer, duration: Date.now() - startTime }, 'Legacy ADS referrer redirect');
      const response = NextResponse.redirect(url);
      setPrefsCookie(response, req, { mode: 'ASTROPHYSICS', searchMode: 'ADS_COMPAT' });
      return response;
    }
  }

  const res = NextResponse.next();

  // Emit analytics
  void emitAnalytics(req);

  // Skip middleware for data prefetches
  if (path.startsWith('/_next/data')) {
    log.debug({ path, duration: Date.now() - startTime }, 'Skipping data prefetch');
    return res;
  }

  // For the home page, only hydrate session to avoid redirect loops
  if (path === '/') {
    const session = await getIronSession(req, res, sessionConfig);
    await initSession(req, res, session);
    log.info(
      {
        path,
        authenticated: session.isAuthenticated,
        userId: await getUserLogId(session.token?.username),
        anonymous: session.token?.anonymous,
        duration: Date.now() - startTime,
      },
      'Home page session initialized',
    );
    return res;
  }

  // Apply rate limiting (auth/session routes exempt — see isRateLimitExempt)
  if (!isRateLimitExempt(path) && !rateLimit(ip)) {
    log.warn({ ip, path, duration: Date.now() - startTime }, 'Rate limit exceeded');
    return tooManyRequests(req);
  }

  log.debug({ ip, path }, 'Rate limit check passed');

  const session = await getIronSession(req, res, sessionConfig);
  await initSession(req, res, session);

  log.info(
    {
      path,
      authenticated: session.isAuthenticated,
      userId: await getUserLogId(session.token?.username),
      anonymous: session.token?.anonymous,
      hasToken: !!session.token,
      sessionDuration: Date.now() - startTime,
    },
    'Session initialized',
  );

  if (!session.token) {
    log.error(
      {
        path,
        ip,
        duration: Date.now() - startTime,
      },
      'Failed to create session - no token',
    );
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return redirect(url, req, { message: 'api-connect-failed' });
  }

  if (path.startsWith('/user/account/login')) {
    log.debug({ path, authenticated: session.isAuthenticated }, 'Login route');
    return loginMiddleware(req, res);
  }

  if (path.startsWith('/user/account/register') || path.startsWith('/user/forgotpassword')) {
    log.debug({ path, authenticated: session.isAuthenticated }, 'Auth exception route');
    return redirectIfAuthenticated(req, res);
  }

  if (
    path.startsWith('/user/libraries') ||
    path.startsWith('/user/settings') ||
    path.startsWith('/user/notifications')
  ) {
    log.debug({ path, authenticated: session.isAuthenticated }, 'Protected route');
    return protectedRoute(req, res);
  }

  if (path.startsWith('/user/account/verify/change-email') || path.startsWith('/user/account/verify/register')) {
    log.debug({ path }, 'Verify route');
    return verifyMiddleware(req, res, session);
  }

  // check if URL is a search redirect
  if (isLegacySearchURL(req)) {
    log.debug({ path }, 'Legacy search URL redirect');
    return legacySearchURLMiddleware(req);
  }

  log.info(
    {
      path,
      authenticated: session.isAuthenticated,
      userId: await getUserLogId(session.token?.username),
      duration: Date.now() - startTime,
    },
    'Request processed successfully',
  );
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
