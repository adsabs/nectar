import { AppState, useStore, useStoreApi } from '@store';
import { useCallback } from 'react';

const setPrefsSelector = (state: AppState) => state.updatePreferences;

// Simple wrapper around user preferences state
export const useUserPreferences = (): [() => AppState['preferences'], AppState['updatePreferences']] => {
  const store = useStoreApi();
  const updatePrefs = useStore(setPrefsSelector);

  // wrap prefs in a callback to allow for lazy updates
  const getPrefs = useCallback(() => store.getState().preferences, []);

  return [getPrefs, updatePrefs];
};
