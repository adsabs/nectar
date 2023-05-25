import { IUserRegistrationCredentials } from '@api';
import { registerUser } from '@auth-utils';
import { useToast } from '@chakra-ui/react';
import { BasicMsg, IAuthHooksOptions } from '@lib/auth/types';
import { useRouter } from 'next/router';
import { isNonEmptyString, isPlainObj, notEqual } from 'ramda-adjunct';
import { useEffect, useState } from 'react';

export const useRegister = (creds: IUserRegistrationCredentials, options: IAuthHooksOptions<BasicMsg<string>>) => {
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

  const register = async () => {
    try {
      const result = await registerUser(creds);
      if (result === true) {
        if (!options.noRedirect) {
          await router.push('/user/account/login');
        }
        toast({
          status: 'success',
          title: `Successfully registered! Please check your email`,
        });

        const msg = { ok: true };
        if (typeof options.onSuccess === 'function') {
          options.onSuccess(msg);
        }
        return msg;
      } else if (typeof result === 'string') {
        const msg = { error: result, ok: false };
        if (typeof options.onError === 'function') {
          options.onError(msg);
        }

        return msg;
      }
    } catch (e) {}
    const msg = { error: 'Unable to register user', ok: false };
    if (typeof options.onError === 'function') {
      options.onError(msg);
    }
    return msg;
  };

  useEffect(() => {
    if (options.enabled && isUserRegistrationCredentials(creds)) {
      void register();
    }
  }, [options.enabled, creds]);

  return {
    result,
  };
};

const isUserRegistrationCredentials = (val: IUserRegistrationCredentials): val is IUserRegistrationCredentials => {
  return (
    isPlainObj(val) &&
    isNonEmptyString(val.email) &&
    isNonEmptyString(val.password) &&
    isNonEmptyString(val.confirmPassword)
  );
};
