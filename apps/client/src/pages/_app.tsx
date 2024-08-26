import 'nprogress/nprogress.css';
import '../styles/styles.css';
import '../styles/page-loader.css';

import { ChakraProvider } from '@chakra-ui/react';
import { GoogleTagManager, sendGTMEvent } from '@next/third-parties/google';
import { DehydratedState, Hydrate, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC, ReactElement, useEffect } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useIsClient } from 'src/lib';

import { Layout } from '@/components';
import { BRAND_NAME_FULL } from '@/config';
import { useCreateQueryClient } from '@/lib/useCreateQueryClient';
import { logger } from '@/logger';
import { MathJaxProvider } from '@/mathjax';
import { AppState, StoreProvider, useCreateStore, useStore } from '@/store';
import { theme } from '@/theme';
import { AppMode } from '@/types';

if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
  require('../mocks');
}

const TopProgressBar = dynamic<Record<string, never>>(
  () => import('@/components/TopProgressBar').then((mod) => mod.TopProgressBar),
  {
    ssr: false,
  },
);

export type AppPageProps = {
  dehydratedState: DehydratedState;
  dehydratedAppState: AppState;
  [key: string]: unknown;
};

const NectarApp = ({ Component, pageProps }: AppProps): ReactElement => {
  // const router = useRouter();

  // useMemo(() => {
  //   router.prefetch = () => new Promise((res) => res());
  // }, [router]);

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME_FULL}`}</title>
      </Head>
      <Providers pageProps={pageProps as AppPageProps}>
        <AppModeRouter />
        <TopProgressBar />
        <Layout>
          <Component {...pageProps} />
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        </Layout>
      </Providers>
    </>
  );
};

const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
      <MathJaxProvider>
        <ChakraProvider theme={theme}>
          <StoreProvider createStore={createStore}>
            <QCProvider>
              <Hydrate state={pageProps.dehydratedState}>
                {children}
                <ReactQueryDevtools />
              </Hydrate>
            </QCProvider>
          </StoreProvider>
        </ChakraProvider>
      </MathJaxProvider>
    </GoogleReCaptchaProvider>
  );
};

const QCProvider: FC = ({ children }) => {
  const queryClient = useCreateQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const AppModeRouter = (): ReactElement => {
  const mode = useStore((state) => state.mode);
  const router = useRouter();
  const isClient = useIsClient();

  useEffect(() => {
    // redirect to main form if path is not valid
    if (isClient) {
      if (mode !== AppMode.ASTROPHYSICS && /^\/(classic|paper)-form.*$/.test(router.asPath)) {
        void router.replace('/');
      }
    }
  }, [mode, router.asPath]);

  return <></>;
};

export const reportWebVitals = (metric: NextWebVitalsMetric) => {
  logger.debug('Web Vitals', { metric });

  sendGTMEvent({
    event: 'web_vitals',
    web_vitals_name: metric.name,
    web_vitals_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    web_vitals_label: metric.id,
    non_interaction: true,
  });
};

export default NectarApp;
