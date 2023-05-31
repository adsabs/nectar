import { AppState, useStore } from '@store';
import { orcidKeys, useOrcidPreferences, useOrcidSetPreferences } from '@api/orcid';
import { isValidIOrcidUser } from '@api/orcid/models';
import { useQueryClient } from 'react-query';

const orcidUserSelector = (state: AppState) => state.orcid.user;
export const useOrcidPrefs = () => {
  const qc = useQueryClient();
  const user = useStore(orcidUserSelector);

  const { data: preferences, ...getPreferencesState } = useOrcidPreferences(
    { user },
    {
      enabled: isValidIOrcidUser(user),
      onSuccess: (preferences) => {
        const match = qc.getQueryCache().find(orcidKeys.getPreferences({ user }), { exact: false });
        if (match) {
          qc.setQueryData(match.queryKey, () => preferences);
        }
      },
    },
  );

  const { mutate: setPreferences, ...setPreferencesState } = useOrcidSetPreferences({ user });

  return {
    preferences,
    setPreferences,
    setPreferencesState,
    getPreferencesState,
  };
};
