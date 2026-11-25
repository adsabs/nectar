import { useEffect } from 'react';
import { resolveLegacyHashRoute } from '@/lib/legacyRoutes';
import { LEGACY_REDIRECT_CLASS } from '@/legacy-hash-snippet';
import { logger } from '@/logger';

export const LegacyHashRedirect = (): null => {
  useEffect(() => {
    const revealPage = () => document.documentElement.classList.remove(LEGACY_REDIRECT_CLASS);

    const hash = window.location.hash;
    if (!hash) {
      revealPage();
      return;
    }

    const target = resolveLegacyHashRoute(hash);
    if (!target) {
      revealPage();
      return;
    }

    logger.debug({ msg: 'Redirecting legacy BBB hash route', hash, target });
    window.location.replace(target);
  }, []);

  return null;
};
