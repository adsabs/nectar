import api, { isAuthenticated, IUserData } from '@api';
import { useToast } from '@chakra-ui/react';
import { AppState, useStore, useStoreApi } from '@store';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { BasicMsg } from './types';

const userSelector = (store: AppState) => store.user;
export const useSession = () => {
  const storeApi = useStoreApi();
  const router = useRouter();
  const toast = useToast({ position: 'top' });
  const user = useStore(userSelector);
  const authenticated = useMemo(() => isAuthenticated(user), [user]);

  const logout = async (): Promise<BasicMsg<string>> => {
    try {
      const { data } = await axios.post<{ success: boolean; user?: IUserData; error?: string }>('/api/auth/logout');

      if (data.success) {
        // clear all user data
        storeApi.getState().resetUser();
        storeApi.getState().resetUserSettings();
        api.reset();

        if (data.user) {
          // should have a good logged in user to store
          storeApi.setState({ user: data.user });
        } else {
          // we were logged in successfully, but the bootstrap failed on the server
          // we should fail the login, since the server will be out of sync
          return { ok: false, error: 'Problem logging out, please try again' };
        }

        // redirect to root
        void router.push('/', null, { shallow: false });

        // show message to user
        toast({
          status: 'success',
          title: `Logged out!`,
        });
        return { ok: true };
      } else if (data.error) {
        return { error: data.error, ok: false };
      }
    } catch (e) {}
    return { error: 'Unable to logout user', ok: false };
  };

  return {
    logout,
    isAuthenticated: authenticated,
    user,
  };
};
