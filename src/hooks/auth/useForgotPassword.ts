import { IUserForgotPasswordCredentials } from '@api';
import { forgotPasswordUser } from '@auth-utils';
import { useToast } from '@chakra-ui/react';
import { BasicMsg, IAuthHooksOptions } from '@hooks/auth/types';
import { useRouter } from 'next/router';
import { isNonEmptyString, isPlainObj, notEqual } from 'ramda-adjunct';
import { useEffect, useState } from 'react';

export const useForgotPassword = (
  creds: IUserForgotPasswordCredentials,
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

  const resetPassword = async () => {
    try {
      const result = await forgotPasswordUser(creds);

      if (result === true) {
        if (!options.noRedirect) {
          await router.push('/user/account/login');
        }
        toast({
          status: 'success',
          title: 'Success!',
          description: `We've sent an email to ${creds.email}, please click the link there to reset your password`,
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
    if (options.enabled && isIUserResetPasswordCredentials(creds)) {
      void resetPassword();
    }
  }, [options.enabled, creds]);

  return {
    result,
  };
};

const isIUserResetPasswordCredentials = (
  val: IUserForgotPasswordCredentials,
): val is IUserForgotPasswordCredentials => {
  return isPlainObj(val) && isNonEmptyString(val.email) && isNonEmptyString(val.recaptcha);
};
