import { describe, expect, test, vi } from 'vitest';
import { isSubdomainOf, MAX_PTR_RECORDS, ReverseDnsLookups, verifyReverseDns } from '@/middlewares/reverseDns';

const GOOGLE_DOMAINS = ['googlebot.com', 'google.com'];

const lookups = (overrides: Partial<ReverseDnsLookups> = {}): ReverseDnsLookups => ({
  lookupPtr: vi.fn().mockResolvedValue([]),
  lookupAddresses: vi.fn().mockResolvedValue([]),
  ...overrides,
});

describe('isSubdomainOf', () => {
  test.each([
    ['crawl-66-249-66-1.googlebot.com', 'googlebot.com', true],
    ['googlebot.com', 'googlebot.com', true],
    ['a.b.googlebot.com', 'googlebot.com', true],
    ['crawl-66-249-66-1.googlebot.com.', 'googlebot.com', true],
    ['CRAWL.GoogleBot.COM', 'googlebot.com', true],
  ])('%s is a subdomain of %s -> %s', (hostname, domain, expected) => {
    expect(isSubdomainOf(hostname, domain)).toBe(expected);
  });

  test.each([
    ['evil-googlebot.com', 'googlebot.com'],
    ['googlebot.com.attacker.net', 'googlebot.com'],
    ['notgooglebot.com', 'googlebot.com'],
    ['com', 'googlebot.com'],
    ['', 'googlebot.com'],
  ])('%s is NOT a subdomain of %s', (hostname, domain) => {
    expect(isSubdomainOf(hostname, domain)).toBe(false);
  });
});

describe('verifyReverseDns', () => {
  test('verifies when the PTR matches and the forward lookup confirms the IP', async () => {
    const deps = lookups({
      lookupPtr: vi.fn().mockResolvedValue(['crawl-66-249-66-1.googlebot.com']),
      lookupAddresses: vi.fn().mockResolvedValue(['66.249.66.1']),
    });

    await expect(verifyReverseDns('66.249.66.1', GOOGLE_DOMAINS, deps)).resolves.toBe(true);
    expect(deps.lookupAddresses).toHaveBeenCalledWith('crawl-66-249-66-1.googlebot.com', 'A');
  });

  test('rejects a PTR record that does not resolve back to the same IP', async () => {
    const deps = lookups({
      lookupPtr: vi.fn().mockResolvedValue(['crawl-66-249-66-1.googlebot.com']),
      lookupAddresses: vi.fn().mockResolvedValue(['203.0.113.9']),
    });

    await expect(verifyReverseDns('66.249.66.1', GOOGLE_DOMAINS, deps)).resolves.toBe(false);
  });

  test('rejects an unrelated PTR record without attempting a forward lookup', async () => {
    const deps = lookups({
      lookupPtr: vi.fn().mockResolvedValue(['ec2-1-2-3-4.compute.amazonaws.com']),
    });

    await expect(verifyReverseDns('1.2.3.4', GOOGLE_DOMAINS, deps)).resolves.toBe(false);
    expect(deps.lookupAddresses).not.toHaveBeenCalled();
  });

  test('rejects when there are no PTR records', async () => {
    await expect(verifyReverseDns('1.2.3.4', GOOGLE_DOMAINS, lookups())).resolves.toBe(false);
  });

  test('rejects when the PTR lookup fails', async () => {
    const deps = lookups({ lookupPtr: vi.fn().mockRejectedValue(new Error('ENOTFOUND')) });

    await expect(verifyReverseDns('1.2.3.4', GOOGLE_DOMAINS, deps)).resolves.toBe(false);
  });

  test('keeps checking remaining PTR records after a failed forward lookup', async () => {
    const deps = lookups({
      lookupPtr: vi.fn().mockResolvedValue(['a.googlebot.com', 'b.googlebot.com']),
      lookupAddresses: vi.fn().mockRejectedValueOnce(new Error('SERVFAIL')).mockResolvedValueOnce(['66.249.66.1']),
    });

    await expect(verifyReverseDns('66.249.66.1', GOOGLE_DOMAINS, deps)).resolves.toBe(true);
    expect(deps.lookupAddresses).toHaveBeenCalledTimes(2);
  });

  test('uses AAAA records for an IPv6 client', async () => {
    const deps = lookups({
      lookupPtr: vi.fn().mockResolvedValue(['crawl.googlebot.com']),
      lookupAddresses: vi.fn().mockResolvedValue(['2001:4860:4801:10::1']),
    });

    await expect(verifyReverseDns('2001:4860:4801:10::1', GOOGLE_DOMAINS, deps)).resolves.toBe(true);
    expect(deps.lookupAddresses).toHaveBeenCalledWith('crawl.googlebot.com', 'AAAA');
  });

  test('rejects an empty IP without any lookup', async () => {
    const deps = lookups();

    await expect(verifyReverseDns('', GOOGLE_DOMAINS, deps)).resolves.toBe(false);
    expect(deps.lookupPtr).not.toHaveBeenCalled();
  });

  test('rejects an unparseable IP without any lookup', async () => {
    const deps = lookups();

    await expect(verifyReverseDns('not-an-ip', GOOGLE_DOMAINS, deps)).resolves.toBe(false);
    expect(deps.lookupPtr).not.toHaveBeenCalled();
  });

  describe('address comparison', () => {
    const confirmWith = (returned: string) =>
      lookups({
        lookupPtr: vi.fn().mockResolvedValue(['crawl.googlebot.com']),
        lookupAddresses: vi.fn().mockResolvedValue([returned]),
      });

    test.each([
      ['uncompressed inbound vs compressed resolver output', '2001:4860:4801:0010:0:0:0:2a', '2001:4860:4801:10::2a'],
      ['uppercase inbound', '2001:4860:4801:10::2A', '2001:4860:4801:10::2a'],
      ['IPv4-mapped inbound vs plain IPv4 record', '::ffff:66.249.66.1', '66.249.66.1'],
    ])('verifies despite %s', async (_name, inbound, returned) => {
      await expect(verifyReverseDns(inbound, GOOGLE_DOMAINS, confirmWith(returned))).resolves.toBe(true);
    });

    test('selects A records for an IPv4-mapped inbound address', async () => {
      const deps = confirmWith('66.249.66.1');

      await expect(verifyReverseDns('::ffff:66.249.66.1', GOOGLE_DOMAINS, deps)).resolves.toBe(true);
      expect(deps.lookupAddresses).toHaveBeenCalledWith('crawl.googlebot.com', 'A');
    });

    test('still rejects a genuinely different address', async () => {
      await expect(verifyReverseDns('66.249.66.1', GOOGLE_DOMAINS, confirmWith('66.249.66.2'))).resolves.toBe(false);
    });
  });

  test('caps how many PTR records it will follow', async () => {
    const many = Array.from({ length: 50 }, (_, i) => `host-${i}.googlebot.com`);
    const deps = lookups({
      lookupPtr: vi.fn().mockResolvedValue(many),
      lookupAddresses: vi.fn().mockResolvedValue(['203.0.113.9']),
    });

    await expect(verifyReverseDns('66.249.66.1', GOOGLE_DOMAINS, deps)).resolves.toBe(false);
    expect((deps.lookupAddresses as ReturnType<typeof vi.fn>).mock.calls.length).toBeLessThanOrEqual(MAX_PTR_RECORDS);
  });
});
