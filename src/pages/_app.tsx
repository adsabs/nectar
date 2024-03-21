import { ChakraProvider, cookieStorageManagerSSR, localStorageManager } from '@chakra-ui/react';
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
import { DehydratedState, Hydrate, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { IronSession } from 'iron-session';
import axios from 'axios';
import api, { checkUserData, userKeys } from '@api';
import { isNilOrEmpty, notEqual } from 'ramda-adjunct';
import { useUser } from '@lib/useUser';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import '../styles/styles.css';
import { logger } from '../../logger/logger';
import { GoogleTagManager, sendGTMEvent } from '@next/third-parties/google';

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
  logger.debug('App', { props: pageProps as unknown });

  return (
    <Providers pageProps={pageProps as AppPageProps}>
      <AppModeRouter />
      <TopProgressBar />
      <UserSync />
      <Layout>
        <Component {...pageProps} />
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      </Layout>
    </Providers>
  );
});

const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});
  const colorModeManager =
    typeof pageProps.colorModeCookie === 'string'
      ? cookieStorageManagerSSR(pageProps.colorModeCookie)
      : localStorageManager;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
      <MathJaxProvider>
        <ChakraProvider theme={theme} colorModeManager={colorModeManager}>
          <StoreProvider createStore={createStore}>
            <QCProvider>
              <Hydrate state={pageProps.dehydratedState}>{children}</Hydrate>
              <ReactQueryDevtools />
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

/**
 * Syncs the user data from the server to the client
 * work in progress, not sure if this is the best way to do this
 */
const UserSync = (): ReactElement => {
  const router = useRouter();
  const store = useStoreApi();
  const { user } = useUser();
  const qc = useQueryClient();

  const { data } = useQuery<{
    user: IronSession['token'];
    isAuthenticated: boolean;
  }>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get<{
        user: IronSession['token'];
        isAuthenticated: boolean;
      }>('/api/user', {
        headers: {
          'X-Refresh-Token': 1,
        },
      });
      if (isNilOrEmpty(data)) {
        throw new Error('Empty session');
      }
      return data;
    },
    retry: false,

    // refetch every 5 minutes
    refetchInterval: 60 * 5 * 1000,
  });

  // Comparing the incoming user data with the current user data, and update the store if they are different
  useEffect(() => {
    if (data?.user && checkUserData(data?.user) && notEqual(data.user, user)) {
      logger.debug('User Synced', { user: data.user });

      // if the username has changed, we know it's a new user we should do a full reload
      if (user.username !== data.user.username) {
        logger.debug('Detected a username change, assuming session is expired');
        void router.push('/user/account/login?notify=account-session-expired');
        return;
      }

      store.setState({ user: data.user });

      // apply the user data to the api instance
      api.setUserData(data.user);

      // attempt to invalidate any currently cached user settings
      void qc.invalidateQueries(userKeys.getUserSettings());
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
