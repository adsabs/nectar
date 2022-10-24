import { IBootstrapPayload } from '@api';
import { StoreSlice } from '@store';

export interface IAppStateUserSlice {
  user: Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expire_in'>;

  resetUser: () => void;
}

const defaultUserData: IAppStateUserSlice['user'] = {
  username: undefined,
  anonymous: undefined,
  access_token: undefined,
  expire_in: undefined,
};

export const userSlice: StoreSlice<IAppStateUserSlice> = (set) => ({
  user: defaultUserData,

  resetUser: () => set({ user: defaultUserData }, false, 'user/resetUser'),
});
