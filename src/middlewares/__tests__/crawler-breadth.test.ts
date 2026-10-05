import { describe, expect, test } from 'vitest';
import crawlerUserAgents from 'crawler-user-agents';

import { classifyCrawlerAtEdge, CRAWLER_RESULT } from '@/middlewares/crawlers';

const INSTANCES: string[] = [
  ...new Set((crawlerUserAgents as { instances?: string[] }[]).flatMap((entry) => entry.instances ?? [])),
];

const MIN_DETECTION_RATE = 0.99;

const BROWSERS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

describe('crawler detection breadth', () => {
  test('the fixture list is actually populated', () => {
    expect(INSTANCES.length).toBeGreaterThan(1000);
  });

  test(`classifies at least ${MIN_DETECTION_RATE * 100}% of real crawler UAs as non-human`, () => {
    const missed = INSTANCES.filter((ua) => {
      const classification = classifyCrawlerAtEdge(ua, '1.2.3.4', { ipTrusted: true });
      return 'result' in classification && classification.result === CRAWLER_RESULT.HUMAN;
    });

    const rate = (INSTANCES.length - missed.length) / INSTANCES.length;

    expect(rate, `missed ${missed.length} of ${INSTANCES.length}: ${missed.slice(0, 5).join(' | ')}`).toBeGreaterThan(
      MIN_DETECTION_RATE,
    );
  });

  test.each(BROWSERS)('does not misclassify a real browser: %s', (ua) => {
    expect(classifyCrawlerAtEdge(ua, '1.2.3.4', { ipTrusted: true })).toEqual({ result: CRAWLER_RESULT.HUMAN });
  });
});
