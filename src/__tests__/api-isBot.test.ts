import { describe, expect, test, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CRAWLER_RESULT } from '@/middlewares/crawlers';
import { createIsBotHandler, evaluate } from '@/pages/api/isBot';
import type { ReverseDnsLookups } from '@/middlewares/reverseDns';

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
  let lookupPtr: ReverseDnsLookups['lookupPtr'] & ReturnType<typeof vi.fn>;
  let lookupAddresses: ReverseDnsLookups['lookupAddresses'] & ReturnType<typeof vi.fn>;

  const call = async (body: unknown) => {
    const res = makeRes();
    await createIsBotHandler({ lookupPtr, lookupAddresses })({ body } as NextApiRequest, res);
    return res;
  };

  beforeEach(() => {
    lookupPtr = vi.fn<ReverseDnsLookups['lookupPtr']>().mockResolvedValue([]) as typeof lookupPtr;
    lookupAddresses = vi.fn<ReverseDnsLookups['lookupAddresses']>().mockResolvedValue([]) as typeof lookupAddresses;
  });

  describe('body handling', () => {
    test('accepts a string body, as the edge middleware sends it', async () => {
      const res = await call(JSON.stringify({ ua: SLACKBOT, ip: '1.2.3.4' }));

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe(CRAWLER_RESULT.UNVERIFIABLE);
    });

    test('accepts an already-parsed body, as an application/json request arrives', async () => {
      const res = await call({ ua: SLACKBOT, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.UNVERIFIABLE);
    });

    test.each([
      ['malformed JSON', '{not json'],
      ['a non-object body', '42'],
      ['missing fields', { ua: SLACKBOT }],
      ['non-string fields', { ua: 1, ip: 2 }],
    ])('rejects %s with 400 instead of throwing', async (_name, body) => {
      const res = await call(body);

      expect(res.statusCode).toBe(400);
      expect(res.body).toBe(CRAWLER_RESULT.HUMAN);
    });
  });

  describe('classification', () => {
    test('classifies a browser as human without touching DNS', async () => {
      const res = await call({ ua: CHROME, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.HUMAN);
      expect(lookupPtr).not.toHaveBeenCalled();
    });

    test('verifies a crawler whose PTR and forward records round-trip', async () => {
      lookupPtr.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
      lookupAddresses.mockResolvedValue(['66.249.66.1']);

      const res = await call({ ua: GOOGLEBOT, ip: '66.249.66.1' });

      expect(res.body).toBe(CRAWLER_RESULT.BOT);
      expect(lookupAddresses).toHaveBeenCalledWith('crawl-66-249-66-1.googlebot.com', 'A');
    });

    test('flags a crawler whose forward lookup points elsewhere', async () => {
      lookupPtr.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
      lookupAddresses.mockResolvedValue(['203.0.113.9']);

      const res = await call({ ua: GOOGLEBOT, ip: '66.249.66.1' });

      expect(res.body).toBe(CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT);
    });

    test('flags a crawler whose PTR belongs to someone else, without a forward lookup', async () => {
      lookupPtr.mockResolvedValue(['ec2-1-2-3-4.compute.amazonaws.com']);

      const res = await call({ ua: GOOGLEBOT, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT);
      expect(lookupAddresses).not.toHaveBeenCalled();
    });

    test('flags a crawler when the PTR lookup itself fails', async () => {
      lookupPtr.mockRejectedValue(new Error('ENOTFOUND'));

      const res = await call({ ua: GOOGLEBOT, ip: '1.2.3.4' });

      expect(res.body).toBe(CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT);
    });

    test('asks for AAAA records for an IPv6 crawler', async () => {
      lookupPtr.mockResolvedValue(['crawl.googlebot.com']);
      lookupAddresses.mockResolvedValue(['2001:4860:4801:10::1']);

      const res = await call({ ua: GOOGLEBOT, ip: '2001:4860:4801:10::1' });

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
