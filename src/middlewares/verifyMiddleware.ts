import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { sessionConfig } from '@/config';
import { edgeLogger } from '@/logger';
import { ApiTargets } from '@/api/models';
import { IVerifyAccountResponse } from '@/api/user/types';
import { createErrorHandler, ErrorSource, ErrorSeverity } from '@/lib/errorHandler.edge';

const log = edgeLogger.child({}, { msgPrefix: '[verifyMiddleware] ' });
const handleMiddlewareError = createErrorHandler({
  source: ErrorSource.MIDDLEWARE,
  tags: { middleware: 'verifyMiddleware' },
});

const extractToken = (path: string) => {
  try {
    if (typeof path === 'string') {
      const parts = path.split('/');
      const token = parts.pop();
      const route = parts.pop();
      return { token, route };
    }
    return { route: '', token: '' };
  } catch (err) {
    handleMiddlewareError(err, {
      context: { path, operation: 'extractToken' },
    });
    return { route: '', token: '' };
  }
};

export const verifyMiddleware = async (req: NextRequest, res: NextResponse) => {
  log.debug('Handling verify request');
  const session = await getIronSession(req, res, sessionConfig);
  const { route, token } = extractToken(req.nextUrl.pathname);
  const newUrl = req.nextUrl.clone();
  newUrl.pathname = '/';

  if (route === 'change-email' || route === 'register') {
    log.debug({
      msg: 'Verifying token',
      route,
      hasToken: !!session.token,
    });

    if (!session.token?.access_token) {
      handleMiddlewareError(new Error('No access token available for verification'), {
        context: { route, hasSession: !!session, hasToken: !!session.token },
        severity: ErrorSeverity.ERROR,
      });
      return redirect(newUrl, req, 'verify-account-failed');
    }

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

      if (!result.ok) {
        const errorText = await result.text().catch(() => 'Unable to read response body');
        handleMiddlewareError(new Error(`Token verification failed: ${result.status} ${result.statusText}`), {
          context: {
            status: result.status,
            statusText: result.statusText,
            errorText,
            url,
          },
        });
      }

      const json = (await result.json()) as IVerifyAccountResponse;

      if (json.message === 'success') {
        log.debug('Token was verified, redirecting...');
        // apply the session cookie to the response
        res.headers.set('set-cookie', result.headers.get('set-cookie'));
        newUrl.pathname = '/user/account/login';
        return redirect(newUrl, req, 'verify-account-success');
      }

      // known error messages
      if (json?.error.indexOf('unknown verification token') > -1) {
        handleMiddlewareError(new Error('Invalid verification token'), {
          context: { error: json?.error, route },
        });
        return redirect(newUrl, req, 'verify-account-failed');
      }

      if (json?.error.indexOf('already been validated') > -1) {
        handleMiddlewareError(new Error('Token already validated'), {
          context: { error: json?.error, route },
        });
        return redirect(newUrl, req, 'verify-account-was-valid');
      }

      handleMiddlewareError(new Error('Unknown verification issue'), {
        context: { error: json?.error, route },
      });
      return redirect(newUrl, req, 'verify-account-failed');
    } catch (err) {
      handleMiddlewareError(err, {
        context: { route, operation: 'verifyAccount' },
      });
      return redirect(newUrl, req, 'verify-account-failed');
    }
  }
};

const redirect = (url: URL, req: NextRequest, message?: string) => {
  // clean the url of any existing notify params
  url.searchParams.delete('notify');
  if (message) {
    url.searchParams.set('notify', message);
  }
  return NextResponse.redirect(url, req);
};
