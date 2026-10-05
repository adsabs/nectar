import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { resolveClientIp } from '@/middlewares/clientIp';

const headers = (values: Record<string, string>) => ({
  get: (name: string) => values[name.toLowerCase()] ?? values[name] ?? null,
});

describe('resolveClientIp', () => {
  const baseEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
  });

  afterEach(() => {
    process.env = { ...baseEnv };
  });

  test('marks a forwarded IP untrusted when no trusted header is configured', () => {
    expect(resolveClientIp(headers({ 'x-forwarded-for': '1.2.3.4' }))).toEqual({
      ip: '1.2.3.4',
      trusted: false,
    });
  });

  test('never trusts X-Forwarded-For even when it is the only source', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-ingress-client-ip';

    expect(resolveClientIp(headers({ 'x-forwarded-for': '1.2.3.4' })).trusted).toBe(false);
  });

  test('trusts the configured header when present', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-ingress-client-ip';

    expect(resolveClientIp(headers({ 'x-ingress-client-ip': '9.8.7.6', 'x-forwarded-for': '1.2.3.4' }))).toEqual({
      ip: '9.8.7.6',
      trusted: true,
    });
  });

  test('prefers the configured header over the fallbacks', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-real-ip';

    expect(resolveClientIp(headers({ 'x-real-ip': '9.8.7.6', 'x-forwarded-for': '1.2.3.4' }))).toEqual({
      ip: '9.8.7.6',
      trusted: true,
    });
  });

  test('falls back when the configured header is absent', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-ingress-client-ip';

    expect(resolveClientIp(headers({ 'x-real-ip': '1.2.3.4' }))).toEqual({
      ip: '1.2.3.4',
      trusted: false,
    });
  });

  test('takes the first entry of a comma list and trims it', () => {
    expect(resolveClientIp(headers({ 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8 ' })).ip).toBe('1.2.3.4');
  });

  test('reports unknown and untrusted when no header carries an IP', () => {
    expect(resolveClientIp(headers({}))).toEqual({ ip: 'unknown', trusted: false });
  });
});
