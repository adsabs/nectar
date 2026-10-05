import { describe, expect, test } from 'vitest';
import { classifyCrawlerAtEdge, CRAWLER_RESULT, crawlerRangesFor, matchCrawlerUa } from '@/middlewares/crawlers';

const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BINGBOT =
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36';
const GPTBOT = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)';
const SLACKBOT = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';
const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0';

const hostInside = (cidr: string): string | null => {
  const [network, bits] = cidr.split('/');
  if (network.includes(':') || Number(bits) >= 31) {
    return null;
  }

  const octets = network.split('.').map(Number);
  octets[3] += 1;
  return octets.join('.');
};

describe('matchCrawlerUa', () => {
  test.each([
    ['googlebot', GOOGLEBOT, 'googlebot'],
    ['bingbot', BINGBOT, 'bingbot'],
    ['gptbot', GPTBOT, 'gptbot'],
    ['slackbot', SLACKBOT, 'slackbot'],
  ])('matches a real %s product string', (_name, ua, expected) => {
    expect(matchCrawlerUa(ua)?.ua).toBe(expected);
  });

  test.each([
    ['Chrome', CHROME],
    ['Firefox', FIREFOX],
  ])('does not match %s', (_name, ua) => {
    expect(matchCrawlerUa(ua)).toBeNull();
  });

  test('prefers a product token over a vendor URL token', () => {
    expect(matchCrawlerUa(GPTBOT)?.ua).toBe('gptbot');
    expect(matchCrawlerUa(GOOGLEBOT)?.entry.type).toBe('DNS');
  });

  test('leaves unlisted crawlers to isbot rather than a catch-all token', () => {
    expect(matchCrawlerUa('some-unknown-bot/1.0')).toBeNull();
  });

  test.each([
    ['empty', ''],
    ['undefined', undefined],
  ])('returns null for %s input', (_name, ua) => {
    expect(matchCrawlerUa(ua)).toBeNull();
  });
});

const trusted = (ua: string, ip: string) => classifyCrawlerAtEdge(ua, ip, { ipTrusted: true });

describe('classifyCrawlerAtEdge', () => {
  test('classifies browsers as human without deferring', () => {
    expect(trusted(CHROME, '1.2.3.4')).toEqual({ result: CRAWLER_RESULT.HUMAN });
  });

  test('defers DNS-verified crawlers, which the edge cannot resolve', () => {
    expect(trusted(GOOGLEBOT, '1.2.3.4')).toEqual({
      needsDnsVerification: true,
      domains: ['googlebot.com', 'google.com'],
    });
  });

  test('decides unverifiable crawlers locally', () => {
    expect(trusted(SLACKBOT, '1.2.3.4')).toEqual({ result: CRAWLER_RESULT.UNVERIFIABLE });
  });

  test('verifies range-listed crawlers locally, anywhere inside the prefix', () => {
    for (const prefix of crawlerRangesFor('gptbot')) {
      const host = hostInside(prefix);
      if (host === null) {
        continue;
      }
      expect(trusted(GPTBOT, host), `${host} is inside ${prefix}`).toEqual({
        result: CRAWLER_RESULT.BOT,
      });
    }
  });

  test('treats a range-listed crawler from an outside IP as potentially malicious', () => {
    expect(trusted(GPTBOT, '9.9.9.9')).toEqual({
      result: CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT,
    });
  });

  test.each([
    ['ClaudeBot', 'ClaudeBot/1.0 (+claudebot@anthropic.com)'],
    ['meta-externalagent', 'meta-externalagent/1.1'],
    ['Bytespider', 'Bytespider'],
  ])('classifies %s as an unverifiable bot via isbot', (_name, ua) => {
    expect(trusted(ua, '1.2.3.4')).toEqual({ result: CRAWLER_RESULT.UNVERIFIABLE });
  });

  test.each([
    ['Chrome', CHROME],
    ['Firefox', FIREFOX],
  ])('isbot does not misclassify %s', (_name, ua) => {
    expect(trusted(ua, '1.2.3.4')).toEqual({ result: CRAWLER_RESULT.HUMAN });
  });

  test('reports a crawler with no usable IP as unverifiable, not human', () => {
    expect(trusted(GOOGLEBOT, '')).toEqual({ result: CRAWLER_RESULT.UNVERIFIABLE });
  });

  test('refuses to verify any tier when the IP is untrusted', () => {
    const [prefix] = crawlerRangesFor('gptbot');
    const host = hostInside(prefix) as string;

    expect(classifyCrawlerAtEdge(GPTBOT, host, { ipTrusted: false })).toEqual({
      result: CRAWLER_RESULT.UNVERIFIABLE,
    });
    expect(classifyCrawlerAtEdge(GOOGLEBOT, '66.249.66.1', { ipTrusted: false })).toEqual({
      result: CRAWLER_RESULT.UNVERIFIABLE,
    });
  });

  test('a hardcoded published GPTBot address verifies, independent of the snapshot', () => {
    expect(trusted(GPTBOT, '20.171.206.7')).toEqual({ result: CRAWLER_RESULT.BOT });
  });

  test.each([
    ['ChatGPT-User', 'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)'],
    ['OAI-SearchBot', 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)'],
  ])('treats %s as unverifiable rather than malicious', (_name, ua) => {
    expect(trusted(ua, '1.2.3.4')).toEqual({ result: CRAWLER_RESULT.UNVERIFIABLE });
  });
});
