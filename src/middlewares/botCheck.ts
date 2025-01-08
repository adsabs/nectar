import { sessionConfig } from '@/config';
import { getIronSession } from 'iron-session/edge';
import { edgeLogger } from '@/logger';
import { NextRequest, NextResponse, userAgent } from 'next/server';
import { IronSessionData } from 'iron-session';

enum CRAWLER_RESULT {
  BOT,
  HUMAN,
  POTENTIAL_MALICIOUS_BOT,
  UNVERIFIABLE,
}

const getIp = (req: NextRequest) =>
  (
    req.headers.get('X-Original-Forwarded-For') ||
    req.headers.get('X-Forwarded-For') ||
    req.headers.get('X-Real-Ip') ||
    ''
  )
    .split(',')
    .shift() || 'unknown';

const crawlerCheck = async (req: NextRequest, ip: string, ua: string) => {
  try {
    const res = await fetch(new URL('/api/isBot', req.nextUrl), {
      method: 'POST',
      body: JSON.stringify({ ua, ip }),
    });
    return (await res.json()) as CRAWLER_RESULT;
  } catch (err) {
    log.error({ err }, 'Fetching /api/isBot failed, continuing');
    // if the bot check fails, we assume it's a human so we don't restrict a real user because of fetch failure here
    return Promise.resolve(CRAWLER_RESULT.HUMAN);
  }
};

const baseToken: IronSessionData['token'] = {
  anonymous: true,
  expire_in: '9999-01-01T00:00:00',
  username: 'anonymous',
  access_token: 'no-token',
};

const log = edgeLogger.child({}, { msgPrefix: '[botCheck] ' });
const getBotToken = (result: CRAWLER_RESULT): IronSessionData['token'] => {
  switch (result) {
    case CRAWLER_RESULT.BOT:
      log.debug('Bot detected');
      return {
        access_token: process.env.VERIFIED_BOTS_ACCESS_TOKEN,
        ...baseToken,
      };
    case CRAWLER_RESULT.UNVERIFIABLE:
      log.debug('Unverifiable bot detected');
      return {
        access_token: process.env.UNVERIFIABLE_BOTS_ACCESS_TOKEN,
        ...baseToken,
      };
    case CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT:
      log.debug('Potentially malicious bot detected');
      return {
        access_token: process.env.MALICIOUS_BOTS_ACCESS_TOKEN,
        ...baseToken,
      };
    case CRAWLER_RESULT.HUMAN:
    default:
      log.debug('Human detected');
      return null;
  }
};

export const botCheck = async (req: NextRequest, res: NextResponse) => {
  const session = await getIronSession(req, res, sessionConfig);
  const ua = userAgent(req).ua;
  const ip = getIp(req);
  const crawlerResult = await crawlerCheck(req, ip, ua);
  const token = getBotToken(crawlerResult);

  // if token is set, then it's a bot of some kind
  if (token) {
    session.token = token;
    session.isAuthenticated = false;
    session.apiCookieHash = '';
    session.bot = true;
    await session.save();
  }
};
