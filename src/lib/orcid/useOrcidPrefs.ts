import { AppState, useStore } from '@store';
import { orcidKeys, useOrcidPreferences, useOrcidSetPreferences } from '@api/orcid';
import { isValidIOrcidUser } from '@api/orcid/models';
import { useQueryClient } from '@tanstack/react-query';
import { OrcidHookOptions } from '@lib/orcid/types';

const orcidUserSelector = (state: AppState) => state.orcid.user;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;
export const useOrcidPrefs = (options?: OrcidHookOptions<'setPreferences'>) => {
  const qc = useQueryClient();
  const user = useStore(orcidUserSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);

  const {
    data: preferences,
    refetch: refetchPreferences,
    ...getPreferencesState
  } = useOrcidPreferences(
    { user },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
    },
  );

  const { mutate: setPreferences, ...setPreferencesState } = useOrcidSetPreferences(
    { user },
    {
      ...options,
      onSuccess: async (preferences, ...args) => {
        if (typeof options?.onSuccess === 'function') {
          await options?.onSuccess(preferences, ...args);
        }

        const match = qc.getQueryCache().find(orcidKeys.getPreferences({ user }), { exact: false });
        if (match) {
          // take the new preferences object and update the query data in the cache directly
          qc.setQueryData(match.queryKey, () => preferences);
        } else {
          // if no match found, force a refetch to get the preferences data
          void refetchPreferences();
        }
      },
    },
  );

  return {
    preferences,
    setPreferences,
    setPreferencesState,
    getPreferencesState,
  };
};
