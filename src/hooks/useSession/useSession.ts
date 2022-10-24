import api, { isAuthenticated, isUserData } from '@api';
import { useToast } from '@chakra-ui/react';
import { AppState, useStore, useStoreApi } from '@store';
import axios from 'axios';
import { useRouter } from 'next/router';
import { isPlainObj } from 'ramda-adjunct';
import { useMemo } from 'react';
import { authenticateUser, getVaultData, logoutUser, registerUser } from './helpers';
import { BasicMsg, IUserCredentials, IUserRegistrationCredentials } from './types';

const userSelector = (store: AppState) => store.user;
export const useSession = () => {
  const storeApi = useStoreApi();
  const router = useRouter();
  const toast = useToast();
  const user = useStore(userSelector);
  const authenticated = useMemo(() => isAuthenticated(user), [user]);

  const login = async (creds: IUserCredentials, options: { redirectUri?: string } = {}): Promise<BasicMsg<string>> => {
    const { data } = await axios.post<{ success: boolean; error?: string }>('/api/auth/login', creds);
    if (data.success) {
      // finally clear the store of all user data (mainly to clear token)
      storeApi.getState().resetUser();
      storeApi.getState().resetUserSettings();

      // since we logged in successfully, set the user info into state
      storeApi.getState().loginUser(creds.email);

      if (process.env.NODE_ENV !== 'production') {
        const userData = await authenticateUser(creds);
        if (isPlainObj(userData) && isUserData(userData)) {
          storeApi.setState({ user: userData });
        }
      } else {
        api.reset();
      }

      // push vault data into the store
      const vaultData = await getVaultData();

      // TODO: what should happen if vault request fails here?
      // nothing probably, since we don't need it yet
      storeApi.getState().setUserSettings(vaultData ?? {});

      // redirect to the redirect URI
      // TODO: serialize a redirectUri and pull it from storage
      await router.push(options.redirectUri ?? (router.query.redirectUri as string) ?? '/', null, { shallow: false });

      // Why does the `user` endpoint not return user information after login
      toast({ title: `${creds.email} Logged in successfully!` });
      return { ok: true };
    } else if (data.error) {
      return { ok: false, error: data.error };
    }
    return { error: 'Unable to login user', ok: false };
  };

  const logout = async (): Promise<BasicMsg<string>> => {
    const { data } = await axios.post<{ success: boolean; error?: string }>('/api/auth/logout');

    if (data.success) {
      // clear all user data
      storeApi.getState().resetUser();
      storeApi.getState().resetUserSettings();

      if (process.env.NODE_ENV !== 'production') {
        const userData = await logoutUser();
        if (isPlainObj(userData) && isUserData(userData)) {
          storeApi.setState({ user: userData });
        }
      } else {
        api.reset();
      }

      // redirect to root
      void router.push('/', null, { shallow: false });

      // alert the user, we don't have a username at this point, so better to show a generic message
      // Why does the `user` endpoint not return user information after login
      toast({ title: `Logged out!` });
      return { ok: true };
    } else if (data.error) {
      return { error: data.error, ok: false };
    }
    return { error: 'Unable to logout user', ok: false };
  };

  const register = async (creds: IUserRegistrationCredentials): Promise<BasicMsg<string>> => {
    const result = await registerUser(creds);
    if (result === true) {
      toast({ title: `Successfully registered! Please check your email` });
      return { ok: true };
    } else if (typeof result === 'string') {
      return { error: result, ok: false };
    }
    return { error: 'Unable to register user', ok: false };
  };

  return {
    login,
    logout,
    register,
    isAuthenticated: authenticated,
  };
};
