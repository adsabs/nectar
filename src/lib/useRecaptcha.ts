import { useExecuteRecaptcha } from '@api';
import { GOOGLE_RECAPTCHA_KEY } from '@config';
import { parseAPIError } from '@utils';
import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA, { ReCAPTCHAProps } from 'react-google-recaptcha';

interface IUseRecaptchaProps {
  onExecute?: (recaptcha: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export const useRecaptcha = (props: IUseRecaptchaProps) => {
  const recaptchaRef = useRef<ReCAPTCHA>();
  const [recaptcha, setRecaptcha] = useState<string>(null);
  const [error, setError] = useState<string>(null);

  const result = useExecuteRecaptcha(recaptchaRef?.current, {
    enabled:
      typeof props.enabled === 'boolean'
        ? props.enabled && recaptchaRef.current !== null
        : recaptchaRef.current !== null,
    notifyOnChangeProps: ['data', 'error'],
  });

  useEffect(() => {
    if (result.data) {
      setRecaptcha(result.data);
      if (typeof props.onExecute === 'function') {
        props.onExecute(result.data);
      }
    }
    if (result.error) {
      const error = parseAPIError(result.error);
      if (typeof props.onError === 'function') {
        props.onError(error);
      }
      setError(error);
    }
  }, [result.data, result.error]);

  return {
    recaptcha,
    error,
    refetch: result.refetch,
    getRecaptchaProps: () =>
      ({
        ref: recaptchaRef,
        size: 'invisible',
        sitekey: GOOGLE_RECAPTCHA_KEY,
      } as ReCAPTCHAProps),
  };
};
