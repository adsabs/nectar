import { IBootstrapPayload } from '@api/lib/accounts/types';
import { StoreSlice } from '@store';

export interface IAppStateUserSlice {
  user: Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expire_in'>;
}

export const userSlice: StoreSlice<IAppStateUserSlice> = () => ({
  user: {
    username: undefined,
    anonymous: undefined,
    access_token: undefined,
    expire_in: undefined,
  },
});
