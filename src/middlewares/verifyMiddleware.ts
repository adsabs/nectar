import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { sessionConfig } from '@/config';
import { edgeLogger } from '@/logger';
import { ApiTargets } from '@/api/models';
import { IVerifyAccountResponse } from '@/api/user/types';

const log = edgeLogger.child({}, { msgPrefix: '[verifyMiddleware] ' });

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
    log.error({ err, path }, 'Error caught attempting to extract verify token');
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
    });

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
        log.debug('Token was verified, redirecting...');
        // apply the session cookie to the response
        res.headers.set('set-cookie', result.headers.get('set-cookie'));
        newUrl.pathname = '/user/account/login';
        return redirect(newUrl, req, 'verify-account-success');
      }

      // known error messages
      if (json?.error.indexOf('unknown verification token') > -1) {
        log.error({
          msg: 'Token was invalid, verify failed, redirecting...',
          error: json?.error,
        });
        return redirect(newUrl, req, 'verify-account-failed');
      }

      if (json?.error.indexOf('already been validated') > -1) {
        log.error({
          msg: 'Token was already validated, redirecting...',
          error: json?.error,
        });
        return redirect(newUrl, req, 'verify-account-was-valid');
      }

      log.error({
        msg: 'Unknown issue, unable to verify, redirecting...',
        error: json?.error,
      });
      return redirect(newUrl, req, 'verify-account-failed');
    } catch (error) {
      log.error({
        msg: 'Unknown issue, unable to verify, redirecting...',
        error,
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
