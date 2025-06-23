import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/logger';

const log = logger.child({}, { msgPrefix: '[sentry-monitor] ' });

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const parsed = new URL(process.env.NEXT_PUBLIC_SENTRY_DSN || '');
const monitorBaseUrl = `${parsed.protocol}//${parsed.hostname}/api${parsed.pathname}/envelope/`;
log.debug({ parsed, monitorBaseUrl }, 'Parsed Sentry DSN and constructed monitor base URL');

export default async function monitor(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!monitorBaseUrl) {
    log.error('Missing NEXT_PUBLIC_SENTRY_DSN');
    return res.status(500).json({ error: 'Missing DSN' });
  }

  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);
    const forwardRes = await fetch(monitorBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': Array.isArray(req.headers['content-type'])
          ? req.headers['content-type'][0]
          : req.headers['content-type'] || 'application/octet-stream',
        'X-Sentry-Auth': Array.isArray(req.headers['x-sentry-auth'])
          ? req.headers['x-sentry-auth'][0]
          : req.headers['x-sentry-auth'] || '',
        Origin: Array.isArray(req.headers['origin']) ? req.headers['origin'][0] : req.headers['origin'] || '',
      },
      body: rawBody,
    });

    res.status(forwardRes.status).end();
  } catch (err) {
    if (err instanceof Error) {
      log.error({ err }, 'Error forwarding Sentry envelope');
    }
    res.status(500).json({ err: 'Failed to forward Sentry envelope' });
  }
}
