import Router from 'next/router';
import { useEffect, useState } from 'react';

import { logger } from '@/logger';

export const useIsPageLoading = () => {
  const [isPageLoading, setIsPageLoading] = useState(false);
  logger.debug({ msg: 'useIsPageLoading' });
  useEffect(() => {
    const start = () => setIsPageLoading(true);
    const end = () => setIsPageLoading(false);
    Router.events.on('routeChangeStart', start);
    Router.events.on('routeChangeComplete', end);
    Router.events.on('routeChangeError', end);
    return () => {
      Router.events.off('routeChangeStart', start);
      Router.events.off('routeChangeComplete', end);
      Router.events.off('routeChangeError', end);
    };
  }, []);

  return { isPageLoading };
};
