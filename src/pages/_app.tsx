import { AppState, useStore, useStoreApi } from '@/store';
import { AppMode } from '@/types';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { memo, ReactElement, useEffect, useMemo } from 'react';
import { DehydratedState, useQuery, useQueryClient } from '@tanstack/react-query';
import { IronSession } from 'iron-session';
import axios from 'axios';
import { isNilOrEmpty, notEqual } from 'ramda-adjunct';
import { useUser } from '@/lib/useUser';
import '../styles/styles.css';
import '../styles/page-loader.css';
import { logger } from '@/logger';
import { GoogleTagManager, sendGTMEvent } from '@next/third-parties/google';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';
import { Layout } from '@/components/Layout';
import { useIsClient } from '@/lib/useIsClient';
import api from '@/api/api';
import { userKeys } from '@/api/user/user';
import { Providers } from '@/providers';
import { isUserData } from '@/auth-utils';

if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../mocks');
}

const TopProgressBar = dynamic<Record<string, never>>(
  () =>
    import('@/components/TopProgressBar').then((mod) => ({
      default: mod.TopProgressBar,
    })),
  {
    ssr: false,
  },
);

export type AppPageProps = {
  dehydratedState: DehydratedState;
  dehydratedAppState: AppState;
  [key: string]: unknown;
};

const NectarApp = memo(({ Component, pageProps }: AppProps): ReactElement => {
  logger.debug('App', { props: pageProps as unknown });
  const router = useRouter();

  useMemo(() => {
    router.prefetch = () => Promise.resolve();
  }, [router]);

  return (
    <>
      <Head>
        <DefaultMeta />
        <title>{`${BRAND_NAME_FULL}`}</title>
      </Head>
      <Providers pageProps={pageProps as AppPageProps}>
        <AppModeRouter />
        <TopProgressBar />
        <UserSync />
        <Layout>
          <Component {...pageProps} />
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        </Layout>
      </Providers>
    </>
  );
});
NectarApp.displayName = 'NectarApp';

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
  }, [mode, router.asPath, isClient, router]);

  return <></>;
};

/**
 * Syncs the user data from the server to the client
 * work in progress, not sure if this is the best way to do this
 */
const UserSync = (): ReactElement => {
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
    if (data?.user && isUserData(data?.user) && notEqual(data.user, user)) {
      logger.debug({ msg: 'User Synced', user: data.user });

      store.setState({ user: data.user });

      // apply the user data to the api instance
      api.setUserData(data.user);

      // attempt to invalidate any currently cached user settings
      void qc.invalidateQueries(userKeys.getUserSettings());
    }
  }, [data, store, user]);

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

const DefaultMeta = () => {
  return (
    <>
      <meta name="google-site-verification" content="2K2Hn5eIn2hgc1C9qiHwQQa46piB4bcYshJK5BzPMq0" />
      <meta name="title" content="Science Explorer" />
      <meta
        name="description"
        content="Science Explorer is a digital library for astronomy, physics, and earth science, providing access to 20+ million records and advanced research tools."
      />
      <meta
        name="keywords"
        content="Science Explorer, Digital library, Astronomy research, Physics research, Earth science research, Bibliographic collections, Scientific publications, Refereed literature, Preprints, Research tools, Citation tracking, Interdisciplinary studies, Open science, FAIR principles, Data catalogs, Advanced discovery tools, Scientific knowledge access, Scholarly articles, Bibliometrics, Information science"
      />
      <meta name="robots" content="index, follow" />
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
    </>
  );
};

export default NectarApp;
