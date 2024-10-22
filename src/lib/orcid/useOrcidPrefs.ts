import { AppState, useStore } from '@/store';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { useQueryClient } from '@tanstack/react-query';
import { OrcidHookOptions } from '@/lib/orcid/types';
import { orcidKeys, useOrcidPreferences, useOrcidSetPreferences } from '@/api/orcid/orcid';

const orcidUserSelector = (state: AppState) => state.orcid.user;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;
export const useOrcidPrefs = (options?: {
  setPrefsOptions?: OrcidHookOptions<'setPreferences'>;
  getPrefsOptions?: Parameters<typeof useOrcidPreferences>[1];
}) => {
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
      ...options?.getPrefsOptions,
    },
  );

  const { mutate: setPreferences, ...setPreferencesState } = useOrcidSetPreferences(
    { user },
    {
      ...options?.setPrefsOptions,
      onSuccess: (preferences, ...args) => {
        if (typeof options?.setPrefsOptions?.onSuccess === 'function') {
          options?.setPrefsOptions?.onSuccess(preferences, ...args);
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
    isLoading: setPreferencesState.isLoading || getPreferencesState.isLoading,
    setPreferencesState,
    getPreferencesState,
  };
};
