import { IBootstrapPayload } from '@api/lib/accounts/types';
import { APP_DEFAULTS, NumPerPageOption } from '@config';
import { StoreSlice } from '@store';

export interface IAppStateUserSlice {
  user: Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expire_in'>;
  preferences: {
    numPerPage: NumPerPageOption;
  };
  updatePreferences: (preferences: Partial<IAppStateUserSlice['preferences']>) => void;
}

export const userSlice: StoreSlice<IAppStateUserSlice> = (set) => ({
  user: {
    username: undefined,
    anonymous: undefined,
    access_token: undefined,
    expire_in: undefined,
  },
  preferences: {
    numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
  },
  updatePreferences: (preferences) =>
    set((state) => ({ preferences: { ...state.preferences, ...preferences } }), false, 'updatePreferences'),
});
