import { describe, expect, test } from 'vitest';
import crawlerRanges from '@/middlewares/crawler-ranges.generated.json';
import { parseIp } from '@/middlewares/cidr';

describe('crawler range snapshot', () => {
  const crawlers = Object.entries(crawlerRanges.crawlers);

  test('covers every crawler the registry verifies by range', () => {
    expect(Object.keys(crawlerRanges.crawlers).sort()).toEqual(['duckduckbot', 'gptbot']);
  });

  test.each(crawlers)('%s has prefixes, all parseable as CIDR', (_name, crawler) => {
    expect(crawler.prefixes.length).toBeGreaterThan(0);

    for (const prefix of crawler.prefixes) {
      expect(prefix, `${prefix} should be valid CIDR`).toMatch(/^[0-9a-fA-F.:]+\/\d{1,3}$/);

      const [network, bits] = prefix.split('/');
      const parsed = parseIp(network);
      expect(parsed, `${prefix} network should parse`).not.toBeNull();

      const maxBits = (parsed as Uint8Array).length * 8;
      expect(Number(bits), `${prefix} mask should fit the address family`).toBeLessThanOrEqual(maxBits);

      expect(Number(bits), `${prefix} is implausibly broad`).toBeGreaterThanOrEqual(8);
    }
  });
});
