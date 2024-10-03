import { sessionConfig } from '@/config';
import { getIronSession } from 'iron-session/edge';
import { edgeLogger } from '@/logger';
//  eslint-disable-next-line @next/next/no-server-import-in-page
import { NextRequest, NextResponse, userAgent } from 'next/server';
import { IronSessionData } from 'iron-session';

enum CRAWLER_RESULT {
  BOT,
  HUMAN,
  POTENTIAL_MALICIOUS_BOT,
  UNVERIFIABLE,
}

const getIp = (req: NextRequest) =>
  req.headers.get('X-Original-Forwarded-For') ||
  req.headers.get('X-Forwarded-For') ||
  req.headers.get('X-Real-Ip') ||
  req.ip;

/**
 * Asynchronously checks if a request is from a web crawler.
 *
 * @param {NextRequest} req - The incoming request object.
 * @param {string} ip - The IP address of the request sender.
 * @param {string} ua - The User-Agent string of the request sender.
 * @returns {Promise<CRAWLER_RESULT>} A promise that resolves to the result of the crawler check.
 */
const crawlerCheck = async (req: NextRequest, ip: string, ua: string) => {
  try {
    const res = await fetch(new URL('/api/isBot', req.nextUrl), {
      method: 'POST',
      body: JSON.stringify({ ua, ip }),
    });
    return (await res.json()) as CRAWLER_RESULT;
  } catch (e) {
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
/**
 * Retrieves the bot token based on the crawler result.
 *
 * Depending on the type of crawler result provided, this function
 * will return a specific token for verified bots, unverifiable bots,
 * or potentially malicious bots. If a human is detected, it will
 * return null.
 *
 * @param {CRAWLER_RESULT} result - The result of the crawler detection.
 * @returns {IronSessionData['token']} The token associated with the detected crawler type, or null if human is detected.
 */
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

/**
 * The `botCheck` function examines the incoming request to determine whether it is originating from a bot or a human user.
 *
 * It makes use of the `getIronSession` method to manage session persistence and integrity, storing the result in the
 * `session` object. The function checks the user agent string via `userAgent` method to determine if the request originates
 * from a known bot.
 *
 * If the request is not from a bot (i.e., `userAgentData.isBot` is false), it logs this information for debugging purposes
 * and sets the session's `bot` property to `false`, before saving the session.
 *
 * If the request could be from a bot, it extracts the IP address using `getIp` and performs a crawler check using
 * `crawlerCheck`, passing the request, IP, and user agent information. The function then attempts to retrieve a bot token
 * using `getBotToken` and the results of the crawler check.
 *
 * If a token is identified (indicating a bot), the session is updated to reflect the presence of a bot, authenticated status
 * is reset, the API cookie hash is cleared, and the session is saved.
 *
 * @param {NextRequest} req - The incoming HTTP request object.
 * @param {NextResponse} res - The outgoing HTTP response object.
 * @returns {Promise<void>} - Returns a promise that resolves without a value when session changes are saved.
 */
export const botCheck = async (req: NextRequest, res: NextResponse): Promise<void> => {
  const session = await getIronSession(req, res, sessionConfig);
  const userAgentData = userAgent(req);

  if (!userAgentData.isBot) {
    log.debug({ ua: userAgentData }, 'User agent is not from a known bot, unverifiable');
    session.bot = false;
    await session.save();
    return;
  }

  const ip = getIp(req);
  const crawlerResult = await crawlerCheck(req, ip, userAgentData.ua);
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
