import { StoreSlice } from '@/store';
import { IBootstrapPayload } from '@/api/user/types';

export interface IUserState {
  user: Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expires_at'>;
}

export interface IUserAction {
  resetUser: () => void;
  getUsername: () => string;
}

const defaultUserData: IUserState['user'] = {
  username: undefined,
  anonymous: undefined,
  access_token: undefined,
  expires_at: undefined,
};

export const userSlice: StoreSlice<IUserState & IUserAction> = (set, get) => ({
  user: defaultUserData,

  resetUser: () => set({ user: defaultUserData }, false, 'user/resetUser'),

  getUsername: () => get().user?.username,
});
