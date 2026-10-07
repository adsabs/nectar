import { edgeLogger } from '@/logger';
import { NextRequest, userAgent } from 'next/server';
import { IronSessionData } from 'iron-session';

import { BOT_CHECK_SIGNATURE_HEADER, signBotCheck } from '@/middlewares/botCheckSignature';
import { resolveClientIp } from '@/middlewares/clientIp';
import { classifyCrawlerAtEdge, CRAWLER_RESULT } from '@/middlewares/crawlers';

export const BOT_SESSION_TTL_SECONDS = 6 * 60 * 60;

const log = edgeLogger.child({}, { msgPrefix: '[botCheck] ' });

export const CRAWLER_CHECK_TIMEOUT_MS = 2000;

const crawlerCheck = async (req: NextRequest, ip: string, ua: string) => {
  try {
    const payload = { ua, ip, ts: Date.now() };
    const res = await fetch(new URL('/api/isBot', req.nextUrl), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [BOT_CHECK_SIGNATURE_HEADER]: await signBotCheck(payload, process.env.COOKIE_SECRET),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CRAWLER_CHECK_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`/api/isBot responded ${res.status}`);
    }

    return (await res.json()) as CRAWLER_RESULT;
  } catch (err) {
    log.error({ err }, 'Fetching /api/isBot failed, continuing');
    return Promise.resolve(CRAWLER_RESULT.HUMAN);
  }
};

const buildBotToken = (accessToken: string | undefined, tier: string): IronSessionData['token'] => {
  if (!accessToken) {
    log.error({ tier }, 'Bot access token is not configured, treating request as human');
    return null;
  }

  return {
    anonymous: true,
    expires_at: `${Math.floor(Date.now() / 1000) + BOT_SESSION_TTL_SECONDS}`,
    username: 'anonymous',
    access_token: accessToken,
  };
};

const getBotToken = (result: CRAWLER_RESULT): IronSessionData['token'] => {
  switch (result) {
    case CRAWLER_RESULT.BOT:
      log.debug('Bot detected');
      return buildBotToken(process.env.VERIFIED_BOTS_ACCESS_TOKEN, 'verified');
    case CRAWLER_RESULT.UNVERIFIABLE:
      log.debug('Unverifiable bot detected');
      return buildBotToken(process.env.UNVERIFIABLE_BOTS_ACCESS_TOKEN, 'unverifiable');
    case CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT:
      log.debug('Potentially malicious bot detected');
      return buildBotToken(process.env.MALICIOUS_BOTS_ACCESS_TOKEN, 'malicious');
    case CRAWLER_RESULT.HUMAN:
    default:
      log.debug('Human detected');
      return null;
  }
};

export const botCheck = async (req: NextRequest): Promise<IronSessionData['token']> => {
  const ua = userAgent(req).ua;
  const { ip, trusted } = resolveClientIp(req.headers);

  const classification = classifyCrawlerAtEdge(ua, ip, { ipTrusted: trusted });
  const result = 'result' in classification ? classification.result : await crawlerCheck(req, ip, ua);

  return getBotToken(result);
};
