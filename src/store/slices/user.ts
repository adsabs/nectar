import { IBootstrapPayload } from '@api';
import { StoreSlice } from '@store';

export interface IUserState {
  user: Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expire_in'>;
}

export interface IUserAction {
  resetUser: () => void;
}

const defaultUserData: IUserState['user'] = {
  username: undefined,
  anonymous: undefined,
  access_token: undefined,
  expire_in: undefined,
};

export const userSlice: StoreSlice<IUserState & IUserAction> = (set) => ({
  user: defaultUserData,

  resetUser: () => set({ user: defaultUserData }, false, 'user/resetUser'),
});
