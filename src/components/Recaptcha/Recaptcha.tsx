import { useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { GOOGLE_RECAPTCHA_KEY } from '@config';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const Recaptcha = (props: { onChange?: (value: string) => void }) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const qc = useQueryClient();

  const { data } = useQuery(
    ['recaptcha'],
    async () => {
      if (recaptchaRef.current !== null) {
        return await recaptchaRef.current?.executeAsync();
      }
      return null;
    },
    {
      enabled: qc.getQueryData(['recaptcha']) === undefined,
    },
  );

  useEffect(() => {
    if (data) {
      props?.onChange?.(data);
    }
  }, [data, props?.onChange]);

  return <ReCAPTCHA sitekey={GOOGLE_RECAPTCHA_KEY} ref={recaptchaRef} size="invisible" />;
};
