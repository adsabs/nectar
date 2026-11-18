import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/logger';
import { useStore } from '@/store';

export const useSentryDisciplineTag = () => {
  const mode = useStore((state) => state.mode);

  useEffect(() => {
    try {
      Sentry.setTag('discipline', mode);
    } catch (err) {
      logger.error({ err }, 'useSentryDisciplineTag: setTag error');
    }
  }, [mode]);
};
