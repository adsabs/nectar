import { APP_DEFAULTS, NumPerPageOption } from '@config';
import { StoreSlice } from '@store';

export interface IAppStatePreferencesSlice {
  preferences: {
    numPerPage: NumPerPageOption;
  };
  updatePreferences: (preferences: Partial<IAppStatePreferencesSlice['preferences']>) => void;
}

export const preferencesSlice: StoreSlice<IAppStatePreferencesSlice> = (set) => ({
  preferences: {
    numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
  },
  updatePreferences: (preferences) =>
    set((state) => ({ preferences: { ...state.preferences, ...preferences } }), false, 'updatePreferences'),
});
