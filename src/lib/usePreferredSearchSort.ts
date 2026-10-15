import { SolrSortField } from '@/api/models';
import { readPreferredSearchSortPref } from '@/utils/common/prefs-cookie';
import { useSettings } from '@/lib/useSettings';

export const usePreferredSearchSort = (): SolrSortField => {
  const { settings, getSettingsState } = useSettings({ suspense: false });

  if (getSettingsState.isPlaceholderData) {
    return readPreferredSearchSortPref();
  }

  return settings.preferredSearchSort;
};
