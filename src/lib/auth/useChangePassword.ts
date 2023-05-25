import { IUserChangePasswordCredentials } from '@api';
import { changePasswordUser } from '@auth-utils';
import { useToast } from '@chakra-ui/react';
import { BasicMsg, IAuthHooksOptions } from '@lib/auth/types';
import { useRouter } from 'next/router';
import { isNonEmptyString, isPlainObj, notEqual } from 'ramda-adjunct';
import { useEffect, useState } from 'react';

export const useChangePassword = (
  creds: IUserChangePasswordCredentials,
  options: IAuthHooksOptions<BasicMsg<string>> = {},
) => {
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

  const changePassword = async () => {
    try {
      const result = await changePasswordUser(creds);

      if (result === true) {
        if (!options.noRedirect) {
          await router.push('/', null, { shallow: false });
        }
        toast({
          status: 'success',
          title: 'Success!',
          description: `Password has been reset`,
          ...(options.successToastOptions ? options.successToastOptions : {}),
        });
        const msg = { ok: true };
        setResult(msg);
        if (typeof options.onSuccess === 'function') {
          options.onSuccess(msg);
        }
      } else if (typeof result === 'string') {
        const msg = { ok: false, error: result };
        setResult(msg);
        if (typeof options.onError === 'function') {
          options.onError(msg);
        }
      }
    } catch (e) {
      const msg = { error: 'Unable to submit request, please try again later', ok: false };
      setResult(msg);
      if (typeof options.onError === 'function') {
        options.onError(msg);
      }
    }
  };

  useEffect(() => {
    if (options.enabled && isIUserChangePasswordCredentials(creds)) {
      void changePassword();
    }
  }, [options.enabled, creds]);

  return {
    result,
  };
};

const isIUserChangePasswordCredentials = (
  val: IUserChangePasswordCredentials,
): val is IUserChangePasswordCredentials => {
  return (
    isPlainObj(val) &&
    isNonEmptyString(val.password) &&
    isNonEmptyString(val.currentPassword) &&
    isNonEmptyString(val.confirmPassword)
  );
};
