import api, { IAuthLoginResponse, IUserCredentials } from '@api';
import { getVaultData } from '@auth-utils';
import { useToast } from '@chakra-ui/react';
import { BasicMsg, IAuthHooksOptions } from '@lib/auth/types';
import { useStoreApi } from '@store';
import axios from 'axios';
import { useRouter } from 'next/router';
import { isNonEmptyString, isPlainObj, notEqual } from 'ramda-adjunct';
import { useEffect, useState } from 'react';

export const useLogin = (creds: IUserCredentials, options: Omit<IAuthHooksOptions<BasicMsg<string>>, 'noRedirect'>) => {
  const storeApi = useStoreApi();
  const toast = useToast({ position: 'top' });
  const router = useRouter();
  const [result, setResult] = useState<BasicMsg<string>>(null);
  const [prevCreds, setPrevCreds] = useState(creds);

  const reset = () => {
    setResult(null);
  };

  useEffect(() => {
    if (notEqual(creds, prevCreds)) {
      reset();
      setPrevCreds(creds);
    }
  }, [creds]);

  const login = async () => {
    try {
      const { data } = await axios.post<IAuthLoginResponse>('/api/auth/login', creds);
      if (data.success) {
        // clear the store of all user data (mainly :w
        // to clear token)
        storeApi.getState().resetUser();
        storeApi.getState().resetUserSettings();
        api.reset();

        if (data.user) {
          // should have a good logged in user to store
          storeApi.setState({ user: data.user });
        } else {
          // we were logged in successfully, but the bootstrap failed on the server
          // we should fail the login, since the server will be out of sync
          const msg = { ok: false, error: 'Problem logging in, please try again' };
          if (typeof options.onError === 'function') {
            options.onError(msg);
          }
          return msg;
        }

        // push vault data into the store
        const vaultData = await getVaultData();

        // TODO: what should happen if vault request fails here?
        // nothing probably, since we don't need it yet
        storeApi.getState().setUserSettings(vaultData ?? {});

        // redirect to the redirect URI
        // TODO: serialize a redirectUri and pull it from storage
        await router.push(options.redirectUri ?? (router.query.redirectUri as string) ?? '/', null, { shallow: false });

        // show message to user
        toast({
          status: 'success',
          title: `${creds.email} Logged in successfully!`,
        });
        const msg = { ok: true };
        if (typeof options.onSuccess === 'function') {
          options.onSuccess(msg);
        }
        return msg;
      } else if (data.error) {
        const msg = { ok: false, error: data.error };
        if (typeof options.onError === 'function') {
          options.onError(msg);
        }
        return msg;
      }
    } catch (e) {}
    const msg = { error: 'Unable to login user', ok: false };
    if (typeof options.onError === 'function') {
      options.onError(msg);
    }
    return msg;
  };

  useEffect(() => {
    if (options.enabled && isUserCredentials(creds)) {
      void login();
    }
  }, [options.enabled, creds]);

  return {
    result,
  };
};

const isUserCredentials = (val: IUserCredentials): val is IUserCredentials => {
  return isPlainObj(val) && isNonEmptyString(val.email) && isNonEmptyString(val.password);
};
