import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { webcrypto } from 'crypto';

import {
  BOT_CHECK_MAX_SKEW_MS,
  BOT_CHECK_SIGNATURE_HEADER,
  BotCheckPayload,
  signBotCheck,
} from '@/middlewares/botCheckSignature';
import { CRAWLER_RESULT } from '@/middlewares/crawlers';
import { createIsBotHandler, evaluate } from '@/pages/api/isBot';
import type { ReverseDnsLookups } from '@/middlewares/reverseDns';

const SECRET = 'test-cookie-secret-at-least-32-chars';

const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const SLACKBOT = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';
const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const makeRes = () => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as NextApiResponse & { statusCode: number; body: unknown };
};

describe('isBot handler', () => {
  const ORIGINAL_SECRET = process.env.COOKIE_SECRET;
  let lookupPtr: ReverseDnsLookups['lookupPtr'] & ReturnType<typeof vi.fn>;
  let lookupAddresses: ReverseDnsLookups['lookupAddresses'] & ReturnType<typeof vi.fn>;

  const call = async (body: unknown, headers: Record<string, string> = {}) => {
    const res = makeRes();
    await createIsBotHandler({ lookupPtr, lookupAddresses })({ body, headers } as NextApiRequest, res);
    return res;
  };

  const callSigned = async (
    payload: { ua: string; ip: string; ts?: number },
    { asString = false }: { asString?: boolean } = {},
  ) => {
    const signed: BotCheckPayload = { ts: Date.now(), ...payload };
    return call(asString ? JSON.stringify(signed) : signed, {
      [BOT_CHECK_SIGNATURE_HEADER]: await signBotCheck(signed, SECRET),
    });
  };

  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
    }
  });

  beforeEach(() => {
    process.env.COOKIE_SECRET = SECRET;
    lookupPtr = vi.fn<ReverseDnsLookups['lookupPtr']>().mockResolvedValue([]) as typeof lookupPtr;
    lookupAddresses = vi.fn<ReverseDnsLookups['lookupAddresses']>().mockResolvedValue([]) as typeof lookupAddresses;
  });

  afterEach(() => {
    process.env.COOKIE_SECRET = ORIGINAL_SECRET;
  });

  describe('body handling', () => {
    test('accepts a string body, as the edge middleware sends it', async () => {
      const res = await callSigned({ ua: SLACKBOT, ip: '1.2.3.4' }, { asString: true });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(CRAWLER_RESULT.UNVERIFIABLE);
    });

    test('accepts an already-parsed body, as an application/json request arrives', async () => {
      const res = await callSigned({ ua: SLACKBOT, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.UNVERIFIABLE);
    });

    test.each([
      ['malformed JSON', '{not json'],
      ['a non-object body', '42'],
      ['missing fields', { ua: SLACKBOT }],
      ['non-string fields', { ua: 1, ip: 2 }],
      ['a body with no timestamp', { ua: SLACKBOT, ip: '1.2.3.4' }],
    ])('rejects %s with 400 instead of throwing', async (_name, body) => {
      const res = await call(body);

      expect(res.statusCode).toBe(400);
      expect(res.body).toBe(CRAWLER_RESULT.HUMAN);
    });
  });

  describe('request signature', () => {
    const payload = { ua: GOOGLEBOT, ip: '66.249.66.1' };

    test('rejects an unsigned request without touching DNS', async () => {
      const res = await call({ ...payload, ts: Date.now() });

      expect(res.statusCode).toBe(403);
      expect(lookupPtr).not.toHaveBeenCalled();
    });

    test('rejects a signature made with a different secret', async () => {
      const signed = { ...payload, ts: Date.now() };
      const res = await call(signed, {
        [BOT_CHECK_SIGNATURE_HEADER]: await signBotCheck(signed, 'not-the-deployed-secret'),
      });

      expect(res.statusCode).toBe(403);
      expect(lookupPtr).not.toHaveBeenCalled();
    });

    test('rejects a signature replayed outside the skew window', async () => {
      const res = await callSigned({ ...payload, ts: Date.now() - BOT_CHECK_MAX_SKEW_MS - 1 });

      expect(res.statusCode).toBe(403);
      expect(lookupPtr).not.toHaveBeenCalled();
    });

    test('rejects a body altered after signing', async () => {
      const signed: BotCheckPayload = { ...payload, ts: Date.now() };
      const signature = await signBotCheck(signed, SECRET);
      const res = await call({ ...signed, ip: '203.0.113.9' }, { [BOT_CHECK_SIGNATURE_HEADER]: signature });

      expect(res.statusCode).toBe(403);
      expect(lookupPtr).not.toHaveBeenCalled();
    });

    test('rejects every request when no secret is configured', async () => {
      const signed: BotCheckPayload = { ...payload, ts: Date.now() };
      const signature = await signBotCheck(signed, SECRET);
      delete process.env.COOKIE_SECRET;

      const res = await call(signed, { [BOT_CHECK_SIGNATURE_HEADER]: signature });

      expect(res.statusCode).toBe(403);
      expect(lookupPtr).not.toHaveBeenCalled();
    });
  });

  describe('classification', () => {
    test('classifies a browser as human without touching DNS', async () => {
      const res = await callSigned({ ua: CHROME, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.HUMAN);
      expect(lookupPtr).not.toHaveBeenCalled();
    });

    test('verifies a crawler whose PTR and forward records round-trip', async () => {
      lookupPtr.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
      lookupAddresses.mockResolvedValue(['66.249.66.1']);

      const res = await callSigned({ ua: GOOGLEBOT, ip: '66.249.66.1' });

      expect(res.body).toBe(CRAWLER_RESULT.BOT);
      expect(lookupAddresses).toHaveBeenCalledWith('crawl-66-249-66-1.googlebot.com', 'A');
    });

    test('flags a crawler whose forward lookup points elsewhere', async () => {
      lookupPtr.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
      lookupAddresses.mockResolvedValue(['203.0.113.9']);

      const res = await callSigned({ ua: GOOGLEBOT, ip: '66.249.66.1' });

      expect(res.body).toBe(CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT);
    });

    test('flags a crawler whose PTR belongs to someone else, without a forward lookup', async () => {
      lookupPtr.mockResolvedValue(['ec2-1-2-3-4.compute.amazonaws.com']);

      const res = await callSigned({ ua: GOOGLEBOT, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT);
      expect(lookupAddresses).not.toHaveBeenCalled();
    });

    test('flags a crawler when the PTR lookup itself fails', async () => {
      lookupPtr.mockRejectedValue(new Error('ENOTFOUND'));

      const res = await callSigned({ ua: GOOGLEBOT, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT);
    });

    test('asks for AAAA records for an IPv6 crawler', async () => {
      lookupPtr.mockResolvedValue(['crawl.googlebot.com']);
      lookupAddresses.mockResolvedValue(['2001:4860:4801:10::1']);

      const res = await callSigned({ ua: GOOGLEBOT, ip: '2001:4860:4801:10::1' });

      expect(res.body).toBe(CRAWLER_RESULT.BOT);
      expect(lookupAddresses).toHaveBeenCalledWith('crawl.googlebot.com', 'AAAA');
    });
  });

  describe('evaluate', () => {
    test('does not reach DNS for a classification the edge already decided', async () => {
      await expect(evaluate(SLACKBOT, '1.2.3.4', { lookupPtr, lookupAddresses })).resolves.toBe(
        CRAWLER_RESULT.UNVERIFIABLE,
      );
      expect(lookupPtr).not.toHaveBeenCalled();
    });
  });
});
