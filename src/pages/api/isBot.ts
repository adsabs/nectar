import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/logger';
import { resolve as dnsResolve, resolve4 as dnsResolve4 } from 'dns';
import { promisify } from 'util';

enum RESULT {
  BOT,
  HUMAN,
  POTENTIAL_MALICIOUS_BOT,
  UNVERIFIABLE,
}

const log = logger.child({}, { msgPrefix: '[isBot] ' });

/**
 * Handles incoming API requests to determine if the request is made by a bot.
 *
 * This function extracts the user-agent and IP address from the incoming request body,
 * logs the information for diagnostic purposes, evaluates whether the request is from a bot,
 * and returns a JSON response with the evaluation result.
 *
 * @param {NextApiRequest} req - The incoming API request object, which contains the request's body.
 * @param {NextApiResponse} res - The outgoing response object used to return the evaluation result.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const isBot: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const body = JSON.parse(req.body as string) as { ua: string; ip: string };

  log.info('Checking if request is from a bot', { body });

  const result = await evaluate(body.ua, body.ip);
  return res.json(result);
};

/**
 * Evaluates the given user agent (UA) string and remote IP address to determine a result.
 *
 * @param {string} ua - The user agent string to be evaluated.
 * @param {string} remoteIP - The remote IP address of the request.
 * @returns {string} - The classification result indicating if the request is from a human or not.
 *
 * The function first checks if the remote IP address is a non-empty string.
 * If it is not, it logs a debug message and returns a default result indicating the request is from a human.
 * If the remote IP is valid, it delegates the classification to another function.
 */
export const evaluate = (ua: string, remoteIP: string): Promise<RESULT> => {
  if (typeof remoteIP !== 'string' || remoteIP.length <= 0) {
    log.debug({ remoteIP }, 'Request IP is not a string or is empty');
    return Promise.resolve(RESULT.HUMAN);
  }
  return classify(ua, remoteIP);
};

/**
 * Classifies the nature of a request based on the provided user agent and remote IP address.
 *
 * @param {string} ua - The user agent string representing the client making the request.
 * @param {string} remoteIP - The remote IP address of the client making the request.
 * @returns {Promise<RESULT>} A Promise that resolves to a classification result indicating if the request is from a human, a verified bot, an unverifiable bot, or a potential malicious bot.
 * @throws Will log and rethrow any errors encountered during the classification process.
 */
const classify = async (ua: string, remoteIP: string): Promise<RESULT> => {
  try {
    const bot = getBot(ua);
    if (bot) {
      if (bot.type === 'UNVERIFIABLE') {
        log.debug({ bot }, 'Request is from a known, but unverifiable bot');
        return RESULT.UNVERIFIABLE;
      }

      if (await verifyBot(bot, remoteIP)) {
        log.debug({ bot }, 'Request is from a known and verified bot');
        return RESULT.BOT;
      }

      log.debug({ bot }, 'Request is from a potential malicious bot');
      return RESULT.POTENTIAL_MALICIOUS_BOT;
    }

    log.debug('Request is likely from a human');
    return RESULT.HUMAN;
  } catch (e) {
    log.error({ err: e }, 'Error during bot classification');
    return RESULT.UNVERIFIABLE;
  }
};

/**
 * Determines the bot information from the provided user agent string.
 *
 * @param {string} userAgentString - The user agent string to parse.
 * @returns {UAEntry|null} The bot information object if the user agent is identified as a bot, otherwise null.
 */
const getBot = (userAgentString: string): UAEntry | null => {
  if (typeof userAgentString !== 'string' || userAgentString.length <= 0) {
    return null;
  }

  const value = userAgentString.toLowerCase();
  return UA.get(value);
};

/**
 * Asynchronously verifies if a bot is permitted based on its type and remote IP address.
 *
 * @param {UAEntry} bot - The bot object containing verification details.
 * @param {string} remoteIP - The remote IP address to be verified.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if verification was successful.
 */
export const verifyBot = async (bot: UAEntry, remoteIP: string): Promise<boolean> => {
  const { type } = bot;
  if (type === 'DNS') {
    return await resolve(remoteIP, bot.DNS);
  }
  if (type === 'IPS') {
    return bot.IPS.includes(remoteIP);
  }
  return false;
};

const reverseDns = promisify(dnsResolve);
const resolve4 = promisify(dnsResolve4);

// PTR Cache
const ptrCache = new Map<string, string[]>();

/**
 * Resolves the PTR record for the given IP address and checks if it resolves to a domain
 * that is in the list of search engine bot domains.
 *
 * @param {string} remoteIp - IP address to resolve
 * @param {string[]} searchEngineBotDomains - List of search engine bot domains to verify against
 * @returns {Promise<boolean>} - Returns true if the IP resolves to a valid bot domain, false otherwise
 */
const resolve = async (remoteIp: string, searchEngineBotDomains: string[]): Promise<boolean> => {
  try {
    if (ptrCache.has(remoteIp)) {
      log.debug({ remoteIp }, 'Using cached PTR records');
      const cachedRecords = ptrCache.get(remoteIp);
      if (cachedRecords) {
        return await checkDomainsAgainstPTR(remoteIp, cachedRecords, searchEngineBotDomains);
      }
    }

    const ptrRecords = await reverseDns(remoteIp);
    log.debug({ ptrRecords }, 'PTR records');

    ptrCache.set(remoteIp, ptrRecords);
    return await checkDomainsAgainstPTR(remoteIp, ptrRecords, searchEngineBotDomains);
  } catch (err) {
    log.error({ err }, 'Error resolving PTR record, could not verify');
    return false;
  }
};

/**
 * Checks the resolved PTR records against the known search engine bot domains.
 *
 * @param {string} remoteIp - The IP address to check
 * @param {string[]} ptrRecords - The PTR records resolved from the IP address
 * @param {string[]} searchEngineBotDomains - List of search engine bot domains to verify against
 * @returns {Promise<boolean>} - Returns true if the IP is verified to belong to a bot, false otherwise
 */
const checkDomainsAgainstPTR = async (
  remoteIp: string,
  ptrRecords: string[],
  searchEngineBotDomains: string[],
): Promise<boolean> => {
  const resolvedDomains = new Set();

  for (const ptrRecord of ptrRecords) {
    const ptrDomain = ptrRecord.toLowerCase();
    for (const searchEngineBotDomain of searchEngineBotDomains) {
      const searchEngineBotDomainParts = searchEngineBotDomain.split('.').reverse();
      const ptrDomainParts = ptrDomain.split('.').reverse();

      if (
        ptrDomainParts.length >= searchEngineBotDomainParts.length &&
        searchEngineBotDomainParts.every((part, index) => part === ptrDomainParts[index])
      ) {
        if (!resolvedDomains.has(ptrDomain)) {
          resolvedDomains.add(ptrDomain);

          const ipAddresses = await resolve4(ptrDomain);
          log.debug({ ptrDomain, ipAddresses }, 'Resolved IP addresses for domain');

          if (ipAddresses.includes(remoteIp)) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

export default isBot;

export enum BOTS {
  GooglebotCom = 'googlebot.com',
  GoogleCom = 'google.com',
  GoogleUserContent = 'googleusercontent.com',
  ApplebotCom = 'applebot.apple.com',
  SearchMsnCom = 'search.msn.com',
  CrawlYahooNet = 'crawl.yahoo.net',
  CrawlBaiduCom = 'crawl.baidu.com',
  CrawlBaiduJp = 'crawl.baidu.jp',
  YandexCom = 'yandex.com',
  YandexRu = 'yandex.ru',
  YandexNet = 'yandex.net',
  AlexaCom = 'alexa.com',
  OpenAI = 'openai.com',
}

export type UAEntry =
  | { type: 'DNS'; DNS: Array<BOTS | string> }
  | { type: 'IPS'; IPS: string[] }
  | { type: 'UNVERIFIABLE' };

const UA = new Map<string, UAEntry>(
  Object.entries({
    googlebot: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom, BOTS.GoogleUserContent] },
    googledocs: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom, BOTS.GoogleUserContent] },
    'mediapartners-google': { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom, BOTS.GoogleUserContent] },
    'feedfetcher-google': { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom, BOTS.GoogleUserContent] },
    'adsbot-google-mobile-apps': { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom, BOTS.GoogleUserContent] },
    applebot: { type: 'DNS', DNS: [BOTS.ApplebotCom] },
    bingbot: { type: 'DNS', DNS: [BOTS.SearchMsnCom] },
    bingpreview: { type: 'DNS', DNS: [BOTS.SearchMsnCom] },
    msnbot: { type: 'DNS', DNS: [BOTS.SearchMsnCom] },
    slurp: { type: 'DNS', DNS: [BOTS.CrawlYahooNet] },
    baiduspider: { type: 'DNS', DNS: [BOTS.CrawlBaiduCom, BOTS.CrawlBaiduJp] },
    yandexbot: { type: 'DNS', DNS: [BOTS.YandexCom, BOTS.YandexRu, BOTS.YandexNet] },
    alexa: { type: 'DNS', DNS: [BOTS.AlexaCom] },
    openai: { type: 'DNS', DNS: [BOTS.OpenAI] },
    gptbot: { type: 'IPS', IPS: ['52.230.152.0', '52.233.106.0'] },
    duckduckbot: {
      type: 'IPS',
      IPS: [
        '20.191.45.212',
        '40.88.21.235',
        '40.76.173.151',
        '40.76.163.7',
        '20.185.79.47',
        '52.142.26.175',
        '20.185.79.15',
        '52.142.24.149',
        '40.76.162.208',
        '40.76.163.23',
        '40.76.162.191',
        '40.76.162.247',
      ],
    },
    ia_archiver: {
      type: 'UNVERIFIABLE',
    },
    facebot: {
      type: 'UNVERIFIABLE',
    },
    facebookexternalhit: {
      type: 'UNVERIFIABLE',
    },
    aolbuild: {
      type: 'UNVERIFIABLE',
    },
    slackbot: {
      type: 'UNVERIFIABLE',
    },
    'slack-imgproxy': {
      type: 'UNVERIFIABLE',
    },
    twitterbot: {
      type: 'UNVERIFIABLE',
    },
    bot: {
      type: 'UNVERIFIABLE',
    },
  }),
);
