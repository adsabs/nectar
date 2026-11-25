import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ReactElement, ReactNode } from 'react';

export interface IReCaptchaProviderProps {
  children: ReactNode;
}

export const ReCaptchaProvider = ({ children }: IReCaptchaProviderProps): ReactElement => (
  <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
    {children}
  </GoogleReCaptchaProvider>
);
