import { describe, expect, test } from 'vitest';
import { isIpInAnyCidr, isIpInCidr, parseIp } from '@/middlewares/cidr';

const bytes = (ip: string) => {
  const parsed = parseIp(ip);
  return parsed === null ? null : Array.from(parsed);
};

describe('parseIp', () => {
  test('parses IPv4', () => {
    expect(bytes('1.2.3.4')).toEqual([1, 2, 3, 4]);
  });

  test('parses IPv6 and expands the zero run', () => {
    expect(parseIp('2001:db8::1')).toHaveLength(16);
    expect(bytes('::1')).toEqual([...Array(15).fill(0), 1]);
    expect(bytes('::')).toEqual(Array(16).fill(0));
    expect(bytes('2001:db8::1')?.slice(0, 4)).toEqual([0x20, 0x01, 0x0d, 0xb8]);
  });

  test('collapses IPv4-mapped IPv6 to IPv4', () => {
    expect(bytes('::ffff:1.2.3.4')).toEqual([1, 2, 3, 4]);
  });

  test.each([
    ['too few octets', '1.2.3'],
    ['octet out of range', '1.2.3.256'],
    ['non-numeric', 'a.b.c.d'],
    ['two zero runs', '1::2::3'],
    ['too many groups', '1:2:3:4:5:6:7:8:9'],
    ['empty', ''],
  ])('rejects %s', (_name, ip) => {
    expect(parseIp(ip)).toBeNull();
  });
});

describe('isIpInCidr', () => {
  test.each([
    ['1.2.3.4', '1.2.3.0/24', true],
    ['1.2.4.4', '1.2.3.0/24', false],
    ['52.230.152.47', '52.230.152.0/24', true],
    ['20.125.66.81', '20.125.66.80/28', true],
    ['20.125.66.96', '20.125.66.80/28', false],
    ['9.9.9.9', '0.0.0.0/0', true],
    ['1.2.3.4', '1.2.3.4/32', true],
    ['1.2.3.5', '1.2.3.4/32', false],
  ])('%s in %s -> %s', (ip, cidr, expected) => {
    expect(isIpInCidr(ip, cidr)).toBe(expected);
  });

  test('matches IPv6 prefixes', () => {
    expect(isIpInCidr('2001:4860:4801:10::5', '2001:4860:4801:10::/64')).toBe(true);
    expect(isIpInCidr('2001:4860:4801:11::5', '2001:4860:4801:10::/64')).toBe(false);
  });

  test('does not match across address families', () => {
    expect(isIpInCidr('1.2.3.4', '2001:db8::/32')).toBe(false);
    expect(isIpInCidr('2001:db8::1', '1.2.3.0/24')).toBe(false);
  });

  test.each([
    ['missing prefix length', '1.2.3.0'],
    ['prefix too long', '1.2.3.0/33'],
    ['negative prefix', '1.2.3.0/-1'],
    ['non-numeric prefix', '1.2.3.0/x'],
    ['empty prefix length', '1.2.3.0/'],
    ['whitespace prefix length', '1.2.3.0/ '],
    ['plus-signed prefix', '1.2.3.0/+8'],
  ])('rejects malformed cidr: %s', (_name, cidr) => {
    expect(isIpInCidr('1.2.3.4', cidr)).toBe(false);
  });
});

describe('isIpInAnyCidr', () => {
  test('matches when any range contains the address', () => {
    expect(isIpInAnyCidr('1.2.3.4', ['9.9.9.0/24', '1.2.3.0/24'])).toBe(true);
    expect(isIpInAnyCidr('1.2.3.4', ['9.9.9.0/24'])).toBe(false);
    expect(isIpInAnyCidr('1.2.3.4', [])).toBe(false);
  });
});
