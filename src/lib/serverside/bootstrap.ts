import { getIronSession } from 'iron-session/edge';
import { pickTracingHeaders, sessionConfig } from '@/config';
import { IncomingMessage, ServerResponse } from 'node:http';
import { isTokenExpired, pickUserData } from '@/auth-utils';
import { ApiTargets } from '@/api/models';
import { logger } from '@/logger';
import { IUserData } from '@/api/user/types';

const log = logger.child({ module: 'bootstrap' }, { msgPrefix: '[bootstrap] ' });

export const bootstrap = async (req: IncomingMessage, res: ServerResponse) => {
  const session = await getIronSession(req, res, sessionConfig);

  if (session.token && !isTokenExpired(session.token.expires_at)) {
    return { token: session.token };
  }

  try {
    const headers = new Headers({ Cookie: req.headers.cookie });
    const tracingHeaders = pickTracingHeaders(req.headers);
    Object.entries(tracingHeaders).forEach(([key, value]) => {
      headers.append(key, value);
    });

    const bsRes = await fetch(`${process.env.API_HOST_SERVER}${ApiTargets.BOOTSTRAP}`, {
      headers,
    });

    if (!bsRes.ok) {
      log.error({ status: bsRes.status, statusText: bsRes.statusText }, 'Failed to fetch bootstrap data');
      return { error: 'Something went wrong retrieving bootstrap data' };
    }

    session.token = pickUserData((await bsRes.json()) as IUserData);
    await session.save();

    if (bsRes.headers.has('set-cookie')) {
      res.setHeader('Set-Cookie', bsRes.headers.get('set-cookie'));
    }

    return { token: session.token };
  } catch (error) {
    log.error({ error }, 'Error fetching bootstrap data');
    return { error: 'Issue fetching bootstrap data' };
  }
};
