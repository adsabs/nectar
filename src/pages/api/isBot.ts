import { NextApiHandler } from 'next';
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

export const isBot: NextApiHandler = async (req, res) => {
  const body = JSON.parse(req.body as string) as { ua: string; ip: string };

  log.info('Checking if request is from a bot', { body });

  const result = await evaluate(body.ua, body.ip);
  return res.json(result);
};

const evaluate = (ua: string, remoteIP: string) => {
  if (typeof remoteIP !== 'string' || remoteIP.length <= 0) {
    log.debug('Request IP is not a string or is empty', { remoteIP });
    return RESULT.HUMAN;
  }
  return classify(ua, remoteIP);
};

const classify = async (ua: string, remoteIP: string) => {
  const bot = getBot(ua);

  if (bot) {
    if (bot.type === 'UNVERIFIABLE') {
      log.debug('Request is from a known, but unverifiable bot', { bot });
      return RESULT.UNVERIFIABLE;
    }

    if (await verifyBot(bot, remoteIP)) {
      log.debug('Request is from a known, and verified bot', { bot });
      return RESULT.BOT;
    }

    log.debug('Request is from an unknown and unverifiable bot', { bot });
    return RESULT.POTENTIAL_MALICIOUS_BOT;
  }
  log.debug('Request is likely from a human');
  return RESULT.HUMAN;
};

const getBot = (userAgentString: string) => {
  if (typeof userAgentString !== 'string' || userAgentString.length <= 0) {
    return null;
  }

  const value = userAgentString.toLowerCase();
  return UA.get(value);
};

const verifyBot = async (bot: UAEntry, remoteIP: string): Promise<boolean> => {
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

/**
 * Resolves the PTR record for the given IP address and checks if it resolves to a domain
 * that is in the list of search engine bot domains.
 *
 * @param {string} remoteIp IP address to resolve
 * @param {string[]} searchEngineBotDomains list of search engine bot domains
 */
const resolve = async (remoteIp: string, searchEngineBotDomains: string[]) => {
  try {
    const ptrRecords = await reverseDns(remoteIp);
    log.debug('PTR records', { ptrRecords });
    const resolvedDomains = new Set();

    for (const ptrRecord of ptrRecords) {
      const ptrDomain = ptrRecord;
      for (const searchEngineBotDomain of searchEngineBotDomains) {
        const ptrDomainParts = ptrDomain.split('.').reverse();
        const searchEngineBotDomainParts = searchEngineBotDomain.split('.').reverse();

        if (
          ptrDomainParts.length >= searchEngineBotDomainParts.length &&
          ptrDomainParts.every((part, index) => part === searchEngineBotDomainParts[index])
        ) {
          if (!resolvedDomains.has(ptrDomain)) {
            resolvedDomains.add(ptrDomain);

            const ipAddresses = await resolve4(ptrDomain);
            log.debug('IP addresses', { ipAddresses });
            if (ipAddresses.includes(remoteIp)) {
              return true;
            } else if (resolvedDomains.size === ptrRecords.length) {
              return false;
            }
          }
        }
      }
    }

    return ptrRecords.length !== 0;
  } catch (error) {
    log.error('Error resolving PTR record, could not verify', { error });
    return false;
  }
};

export default isBot;

enum BOTS {
  GooglebotCom = 'googlebot.com',
  GoogleCom = 'google.com',
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

type UAEntry = { type: 'DNS'; DNS: BOTS[] } | { type: 'IPS'; IPS: string[] } | { type: 'UNVERIFIABLE' };

const UA = new Map<string, UAEntry>(
  Object.entries({
    googlebot: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] },
    googledocs: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] },
    'mediapartners-google': { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] },
    'feedfetcher-google': { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] },
    'adsbot-google-mobile-apps': { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] },
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
