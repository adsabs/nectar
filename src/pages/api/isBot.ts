import { NextApiHandler } from 'next';
import { logger } from '@/logger';
import { resolve as dnsResolve, reverse as dnsReverse } from 'dns';
import { promisify } from 'util';

import { BOT_CHECK_SIGNATURE_HEADER, BotCheckPayload, verifyBotCheck } from '@/middlewares/botCheckSignature';
import { classifyCrawlerAtEdge, CRAWLER_RESULT } from '@/middlewares/crawlers';
import { ReverseDnsLookups, verifyReverseDns } from '@/middlewares/reverseDns';

const log = logger.child({}, { msgPrefix: '[isBot] ' });

const reverseDns = promisify(dnsReverse);
const resolveRecords = promisify(dnsResolve) as (hostname: string, rrtype: string) => Promise<string[]>;

export const nodeDnsLookups: ReverseDnsLookups = {
  lookupPtr: (ip) => reverseDns(ip),
  lookupAddresses: (hostname, family) => resolveRecords(hostname, family),
};

export const evaluate = async (
  ua: string,
  remoteIP: string,
  deps: ReverseDnsLookups = nodeDnsLookups,
): Promise<CRAWLER_RESULT> => {
  const classification = classifyCrawlerAtEdge(ua, remoteIP, { ipTrusted: true });

  if ('result' in classification) {
    return classification.result;
  }

  if (await verifyReverseDns(remoteIP, classification.domains, deps)) {
    log.debug('Request is from a known, and verified bot', { ua });
    return CRAWLER_RESULT.BOT;
  }

  log.debug('Request is from a known but unverified bot', { ua });
  return CRAWLER_RESULT.POTENTIAL_MALICIOUS_BOT;
};

const parseBody = (body: unknown): BotCheckPayload | null => {
  const parsed: unknown = typeof body === 'string' ? JSON.parse(body) : body;

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const { ua, ip, ts } = parsed as { ua?: unknown; ip?: unknown; ts?: unknown };
  return typeof ua === 'string' && typeof ip === 'string' && typeof ts === 'number' ? { ua, ip, ts } : null;
};

const signatureOf = (header: string | string[] | undefined): string | undefined =>
  Array.isArray(header) ? header[0] : header;

export const createIsBotHandler =
  (deps: ReverseDnsLookups = nodeDnsLookups): NextApiHandler =>
  async (req, res) => {
    let body: BotCheckPayload | null;
    try {
      body = parseBody(req.body);
    } catch {
      body = null;
    }

    if (body === null) {
      return res.status(400).json(CRAWLER_RESULT.HUMAN);
    }

    const signature = signatureOf(req.headers[BOT_CHECK_SIGNATURE_HEADER]);
    if (!(await verifyBotCheck(body, signature, process.env.COOKIE_SECRET))) {
      log.warn('Rejecting an unsigned or stale bot check');
      return res.status(403).json(CRAWLER_RESULT.HUMAN);
    }

    log.info('Checking if request is from a bot', { body });

    const result = await evaluate(body.ua, body.ip, deps);
    return res.json(result);
  };

export const isBot = createIsBotHandler();

export default isBot;
