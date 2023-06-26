import { ADSQuery } from '@api/types';
import ReCAPTCHA from 'react-google-recaptcha';
import { useQuery } from '@tanstack/react-query';

export const recaptchaKeys = {
  execute: (recaptcha: ReCAPTCHA) => ['recaptcha/execute', recaptcha?.getWidgetId()],
};

// type helper
type RecaptchaQuery<K extends keyof typeof recaptchaKeys> = ADSQuery<
  Parameters<typeof recaptchaKeys[K]>[0],
  string | null
>;

export const useExecuteRecaptcha: RecaptchaQuery<'execute'> = (recaptcha, options) => {
  return useQuery({
    queryKey: recaptchaKeys.execute(recaptcha),
    queryFn: async () => {
      return await recaptcha?.executeAsync();
    },
    staleTime: 0,
    cacheTime: 0,
    retry: false,
    ...options,
  });
};
