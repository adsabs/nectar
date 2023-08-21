import { GOOGLE_RECAPTCHA_KEY } from '@config';
import { parseAPIError } from '@utils';
import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA, { ReCAPTCHAProps } from 'react-google-recaptcha';
import { useQuery } from '@tanstack/react-query';

interface IUseRecaptchaProps {
  onExecute?: (recaptcha: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export const useRecaptcha = (props?: IUseRecaptchaProps) => {
  const recaptchaRef = useRef<ReCAPTCHA>();
  const [recaptcha, setRecaptcha] = useState<string>(null);
  const [error, setError] = useState<string>(null);
  const enabled = typeof props?.enabled === 'boolean' ? props.enabled : true;

  const { data, isError, ...result } = useQuery(['recaptcha/execute', recaptchaRef.current?.getWidgetId()], {
    queryFn: async () => await recaptchaRef.current?.executeAsync(),
    enabled: !!recaptchaRef.current && enabled,
  });

  useEffect(() => {
    if (data) {
      setRecaptcha(data);
      props?.onExecute?.(data);
    }
    if (isError) {
      const error = parseAPIError(result.error);
      props?.onError?.(error);
      setError(error);
    }
  }, [data, isError]);

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
