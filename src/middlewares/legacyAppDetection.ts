import { NextRequest, NextResponse } from 'next/server';
import { IronSession } from 'iron-session';
import { edgeLogger as logger } from '@/logger';

const log = logger.child({}, { msgPrefix: '[legacyAppDetection] ' });

const LEGACY_APP_DOMAINS = [
  'ui.adsabs.harvard.edu',
  'devui.adsabs.harvard.edu',
  'qa.adsabs.harvard.edu',
  'dev.adsabs.harvard.edu',
];

/**
 * Checks if the request came from the legacy ADS application
 * @param req
 */
export function isFromLegacyApp(req: NextRequest): boolean {
  const referer = req.headers.get('referer');

  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    return LEGACY_APP_DOMAINS.includes(refererUrl.hostname);
  } catch (error) {
    log.debug({ referer, error }, 'Failed to parse referer URL');
    return false;
  }
}

/**
 * Middleware to detect users coming from the legacy ADS app and mark them in the session
 * so their mode can be set to ASTROPHYSICS during SSR hydration.
 *
 * Once set to true, the flag persists for the entire session lifetime.
 * This allows SSR hydration to set the default mode to ASTROPHYSICS for legacy users.
 *
 * Performance: Only saves session when the flag changes from false → true,
 * avoiding expensive encryption on every request.
 *
 * @param req
 * @param res
 * @param session
 */
export async function legacyAppDetectionMiddleware(
  req: NextRequest,
  res: NextResponse,
  session: IronSession,
): Promise<void> {
  const isLegacyReferrer = isFromLegacyApp(req);

  if (isLegacyReferrer && !session.legacyAppReferrer) {
    log.debug({ referer: req.headers.get('referer') }, 'Legacy app referrer detected');
    session.legacyAppReferrer = true;
    await session.save();
  }
}
