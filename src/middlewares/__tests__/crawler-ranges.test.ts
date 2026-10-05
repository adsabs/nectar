import { describe, expect, test } from 'vitest';
import crawlerRanges from '@/middlewares/crawler-ranges.generated.json';
import { parseIp } from '@/middlewares/cidr';

const MAX_SNAPSHOT_AGE_DAYS = 90;

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

  test(`was refreshed within ${MAX_SNAPSHOT_AGE_DAYS} days`, () => {
    const ageDays = (Date.now() - Date.parse(crawlerRanges.fetchedAt)) / 86_400_000;

    expect(Number.isNaN(ageDays)).toBe(false);
    expect(ageDays).toBeLessThan(MAX_SNAPSHOT_AGE_DAYS);
  });
});
