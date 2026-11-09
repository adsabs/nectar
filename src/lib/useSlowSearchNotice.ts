import { useEffect, useState } from 'react';

import { APP_DEFAULTS } from '@/config';

export interface IUseSlowSearchNoticeParams {
  isPending: boolean;
  thresholdMs?: number;
}

export const useSlowSearchNotice = ({
  isPending,
  thresholdMs = APP_DEFAULTS.SLOW_SEARCH_THRESHOLD,
}: IUseSlowSearchNoticeParams): boolean => {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setIsSlow(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSlow(true);
    }, thresholdMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isPending, thresholdMs]);

  return isSlow;
};
