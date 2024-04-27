import { NextApiResponse } from 'next';
import { logger } from '@/logger';

const SENTRY_HOST = 'o1060269.ingest.sentry.io';
const SENTRY_PROJECT_IDS = [process.env.NEXT_PUBLIC_SENTRY_PROJECT_ID];
const log = logger.child({}, { msgPrefix: '[monitor] ' });
const monitor = async (req: Request, res: NextApiResponse) => {
  try {
    const envelope = await req.text();
    const piece = envelope.split('\n')[0];
    const header = JSON.parse(piece) as Record<string, string>;
    const dsn = new URL(header['dsn']);
    const project_id = dsn.pathname?.replace('/', '');

    if (dsn.hostname !== SENTRY_HOST) {
      const error = `Invalid sentry hostname: ${dsn.hostname}`;
      log.error(error);
      return res.status(500).json({ error });
    }

    if (!project_id || !SENTRY_PROJECT_IDS.includes(project_id)) {
      const error = `Invalid sentry project id: ${project_id}`;
      log.error(error);
      return res.status(500).json({ error });
    }

    const upstream_sentry_url = `https://${SENTRY_HOST}/api/${project_id}/envelope/`;
    await fetch(upstream_sentry_url, { method: 'POST', body: envelope });

    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    const error = 'Failed to forward sentry envelope';
    log.error(error, { error: e });
    return res.status(500).json({ error });
  }
};

export default monitor;
