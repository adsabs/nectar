import { useEffect } from 'react';

import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';
import { readPrefsCookie, writePrefsCookie } from '@/utils/common/prefs-cookie';

export const SettingsSync = (): null => {
  const { isAuthenticated } = useSession();
  const {
    settings,
    getSettingsState: { isFetching },
  } = useSettings({}, true);

  useEffect(() => {
    if (!isAuthenticated || isFetching) {
      return;
    }
    if (settings.preferredSearchSort !== readPrefsCookie().preferredSearchSort) {
      writePrefsCookie({ preferredSearchSort: settings.preferredSearchSort });
    }
  }, [isAuthenticated, isFetching, settings.preferredSearchSort]);

  return null;
};
