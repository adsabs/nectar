import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { botCheck } from '@/middlewares/botCheck';
import { CRAWLER_RESULT } from '@/middlewares/crawlers';

const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const GPTBOT = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)';
const SLACKBOT = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';
const CLAUDEBOT = 'ClaudeBot/1.0 (+claudebot@anthropic.com)';
const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const GPTBOT_IP = '20.171.206.7';

describe('botCheck', () => {
  const baseEnv = { ...process.env };

  beforeEach(() => {
    process.env.VERIFIED_BOTS_ACCESS_TOKEN = 'bot-token';
    process.env.UNVERIFIABLE_BOTS_ACCESS_TOKEN = 'unverifiable-token';
    process.env.MALICIOUS_BOTS_ACCESS_TOKEN = 'malicious-token';
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...baseEnv };
    vi.restoreAllMocks();
  });

  const untrustedReq = (ua: string, ip = '1.1.1.1') =>
    new NextRequest('https://example.com/search', {
      headers: { 'user-agent': ua, 'x-forwarded-for': ip },
    });

  const trustedReq = (ua: string, ip = '1.1.1.1') => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-ingress-client-ip';
    return new NextRequest('https://example.com/search', {
      headers: { 'user-agent': ua, 'x-ingress-client-ip': ip },
    });
  };

  const mockCrawlerResponse = (result: CRAWLER_RESULT) =>
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }) as unknown as Response,
    );

  describe('with no trusted IP source', () => {
    test('will not grant the verified tier to a range-listed crawler', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      await expect(botCheck(untrustedReq(GPTBOT, GPTBOT_IP))).resolves.toMatchObject({
        access_token: 'unverifiable-token',
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('will not defer a DNS crawler for verification', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      await expect(botCheck(untrustedReq(GOOGLEBOT, '66.249.66.1'))).resolves.toMatchObject({
        access_token: 'unverifiable-token',
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('with a trusted IP source', () => {
    test('verifies a range-listed crawler without any hop', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      const req = trustedReq(GPTBOT, GPTBOT_IP);

      await expect(botCheck(req)).resolves.toMatchObject({ access_token: 'bot-token' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('flags a range-listed crawler from an outside IP without any hop', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      const req = trustedReq(GPTBOT, '9.9.9.9');

      await expect(botCheck(req)).resolves.toMatchObject({ access_token: 'malicious-token' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('defers a DNS crawler and honours the verdict', async () => {
      const req = trustedReq(GOOGLEBOT, '66.249.66.1');
      mockCrawlerResponse(CRAWLER_RESULT.BOT);

      await expect(botCheck(req)).resolves.toMatchObject({ access_token: 'bot-token' });
    });

    test('treats a failed hop as human so real users are never restricted', async () => {
      const req = trustedReq(GOOGLEBOT, '66.249.66.1');
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

      await expect(botCheck(req)).resolves.toBeNull();
    });
  });

  describe('classifications that need no IP at all', () => {
    test('flags an unverifiable crawler without any hop', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      await expect(botCheck(untrustedReq(SLACKBOT))).resolves.toMatchObject({
        access_token: 'unverifiable-token',
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('flags an AI scraper the curated list omits, without any hop', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      await expect(botCheck(untrustedReq(CLAUDEBOT))).resolves.toMatchObject({
        access_token: 'unverifiable-token',
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('returns null for a browser, without any hop', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      await expect(botCheck(untrustedReq(CHROME))).resolves.toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('token configuration', () => {
    test('treats a bot as human when its tier token is unset', async () => {
      delete process.env.UNVERIFIABLE_BOTS_ACCESS_TOKEN;

      await expect(botCheck(untrustedReq(SLACKBOT))).resolves.toBeNull();
    });

    test('treats a bot as human when its tier token is empty', async () => {
      process.env.UNVERIFIABLE_BOTS_ACCESS_TOKEN = '';

      await expect(botCheck(untrustedReq(SLACKBOT))).resolves.toBeNull();
    });

    test('issues a token that actually expires', async () => {
      const token = await botCheck(untrustedReq(SLACKBOT));
      const expiresAt = Number(token?.expires_at);

      expect(expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(expiresAt).toBeLessThan(Math.floor(Date.now() / 1000) + 24 * 60 * 60);
    });
  });
});
