import { isbot } from 'isbot';

import { isIpInAnyCidr } from '@/middlewares/cidr';
import crawlerRanges from '@/middlewares/crawler-ranges.generated.json';

export enum CRAWLER_RESULT {
  BOT = 0,
  HUMAN = 1,
  POTENTIAL_MALICIOUS_BOT = 2,
  UNVERIFIABLE = 3,
}

export enum BOTS {
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

export type CrawlerRangeKey = keyof typeof crawlerRanges.crawlers;

export type UAEntry =
  | { type: 'DNS'; DNS: BOTS[] }
  | { type: 'RANGES'; crawler: CrawlerRangeKey }
  | { type: 'UNVERIFIABLE' };

export const CRAWLER_UA: ReadonlyArray<{ ua: string; entry: UAEntry }> = [
  { ua: 'googlebot', entry: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] } },
  { ua: 'googledocs', entry: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] } },
  { ua: 'mediapartners-google', entry: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] } },
  { ua: 'feedfetcher-google', entry: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] } },
  { ua: 'adsbot-google-mobile-apps', entry: { type: 'DNS', DNS: [BOTS.GooglebotCom, BOTS.GoogleCom] } },
  { ua: 'applebot', entry: { type: 'DNS', DNS: [BOTS.ApplebotCom] } },
  { ua: 'bingbot', entry: { type: 'DNS', DNS: [BOTS.SearchMsnCom] } },
  { ua: 'bingpreview', entry: { type: 'DNS', DNS: [BOTS.SearchMsnCom] } },
  { ua: 'msnbot', entry: { type: 'DNS', DNS: [BOTS.SearchMsnCom] } },
  { ua: 'slurp', entry: { type: 'DNS', DNS: [BOTS.CrawlYahooNet] } },
  { ua: 'baiduspider', entry: { type: 'DNS', DNS: [BOTS.CrawlBaiduCom, BOTS.CrawlBaiduJp] } },
  { ua: 'yandexbot', entry: { type: 'DNS', DNS: [BOTS.YandexCom, BOTS.YandexRu, BOTS.YandexNet] } },
  { ua: 'gptbot', entry: { type: 'RANGES', crawler: 'gptbot' } },
  { ua: 'openai', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'alexa', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'duckduckbot', entry: { type: 'RANGES', crawler: 'duckduckbot' } },
  { ua: 'ia_archiver', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'facebot', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'facebookexternalhit', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'aolbuild', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'slackbot', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'slack-imgproxy', entry: { type: 'UNVERIFIABLE' } },
  { ua: 'twitterbot', entry: { type: 'UNVERIFIABLE' } },
];

export interface CrawlerMatch {
  ua: string;
  entry: UAEntry;
}

export const matchCrawlerUa = (userAgentString?: string): CrawlerMatch | null => {
  if (typeof userAgentString !== 'string' || userAgentString.length === 0) {
    return null;
  }

  const value = userAgentString.toLowerCase();

  return CRAWLER_UA.find(({ ua }) => value.includes(ua)) ?? null;
};

export const crawlerRangesFor = (crawler: CrawlerRangeKey): readonly string[] =>
  crawlerRanges.crawlers[crawler].prefixes;

export type EdgeClassification = { result: CRAWLER_RESULT } | { needsDnsVerification: true; domains: BOTS[] };

export interface ClassifyCrawlerOptions {
  ipTrusted: boolean;
}

export const classifyCrawlerAtEdge = (
  userAgentString: string,
  remoteIp: string,
  { ipTrusted }: ClassifyCrawlerOptions,
): EdgeClassification => {
  const match = matchCrawlerUa(userAgentString);

  if (!match) {
    return { result: isbot(userAgentString) ? CRAWLER_RESULT.UNVERIFIABLE : CRAWLER_RESULT.HUMAN };
  }

  if (match.entry.type === 'UNVERIFIABLE') {
    return { result: CRAWLER_RESULT.UNVERIFIABLE };
  }

  if (!ipTrusted || typeof remoteIp !== 'string' || remoteIp.length === 0) {
    return { result: CRAWLER_RESULT.UNVERIFIABLE };
  }

  if (match.entry.type === 'RANGES') {
    const verified = isIpInAnyCidr(remoteIp, crawlerRangesFor(match.entry.crawler));
    return { result: verified ? CRAWLER_RESULT.BOT : CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT };
  }

  return { needsDnsVerification: true, domains: match.entry.DNS };
};
