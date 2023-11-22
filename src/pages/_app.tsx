import { ChakraProvider } from '@chakra-ui/react';
import { Layout } from '@components';
import { useIsClient } from 'src/lib';
import { useCreateQueryClient } from '@lib/useCreateQueryClient';
import { MathJaxProvider } from '@mathjax';
import { AppState, StoreProvider, useCreateStore, useStore, useStoreApi } from '@store';
import { theme } from '@theme';
import { AppMode } from '@types';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { FC, memo, ReactElement, useEffect } from 'react';
import { DehydratedState, Hydrate, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { IronSession } from 'iron-session';
import axios from 'axios';
import api, { checkUserData } from '@api';
import { isNilOrEmpty, notEqual } from 'ramda-adjunct';
import { useUser } from '@lib/useUser';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import '../styles/styles.css';
import { GTMProvider, sendToGTM } from '@elgorditosalsero/react-gtm-hook';
import Head from 'next/head';

if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
  require('../mocks');
}

const TopProgressBar = dynamic<Record<string, never>>(
  () => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar),
  {
    ssr: false,
  },
);

export type AppPageProps = { dehydratedState: DehydratedState; dehydratedAppState: AppState; [key: string]: unknown };

const NectarApp = memo(({ Component, pageProps }: AppProps): ReactElement => {
  if (process.env.NODE_ENV === 'development') {
    console.log('pageProps', pageProps);
  }

  return (
    <Providers pageProps={pageProps as AppPageProps}>
      <AppModeRouter />
      <TopProgressBar />
      <UserSync />
      <Layout>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <Component {...pageProps} />
      </Layout>
    </Providers>
  );
});

const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});

  return (
    <GTMProvider state={{ id: process.env.NEXT_PUBLIC_GTM_ID, dataLayerName: 'nectar_gtm_datalayer' }}>
      <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
        <MathJaxProvider>
          <ChakraProvider theme={theme}>
            <StoreProvider createStore={createStore}>
              <QCProvider>
                <Hydrate state={pageProps.dehydratedState}>{children}</Hydrate>
                <ReactQueryDevtools />
              </QCProvider>
            </StoreProvider>
          </ChakraProvider>
        </MathJaxProvider>
      </GoogleReCaptchaProvider>
    </GTMProvider>
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

/**
 * Syncs the user data from the server to the client
 * work in progress, not sure if this is the best way to do this
 */
const UserSync = (): ReactElement => {
  const router = useRouter();
  const store = useStoreApi();
  const { user } = useUser();

  const { data } = useQuery<{
    user: IronSession['token'];
    isAuthenticated: boolean;
  }>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get<{ user: IronSession['token']; isAuthenticated: boolean }>('/api/user');
      if (isNilOrEmpty(data)) {
        throw new Error('Empty session');
      }
      return data;
    },
    retry: 1,
    enabled: !checkUserData(user),
  });

  // Comparing the incoming user data with the current user data, and update the store if they are different
  useEffect(() => {
    if (data?.user && checkUserData(data?.user) && notEqual(data.user, user)) {
      store.setState({ user: data.user });

      // apply the user data to the api instance
      api.setUserData(data.user);
    }
  }, [data, store, user]);

  // if both the incoming and the current user data is invalid, reload the page
  useEffect(() => {
    if (data?.user && !checkUserData(data?.user) && !checkUserData(user)) {
      router.reload();
    }
  }, [data, router, user]);

  return <></>;
};

export const reportWebVitals = (metric: NextWebVitalsMetric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vitals: ${metric.name} [${metric.value} ms]`);
  }

  sendToGTM({
    dataLayerName: 'nectar_gtm_datalayer',
    data: {
      event: 'web_vitals',
      web_vitals_name: metric.name,
      web_vitals_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      web_vitals_label: metric.id,
      non_interaction: true,
    },
  });
};

export default NectarApp;
