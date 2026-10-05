import { AppState } from '@/store';
import App, { AppContext, AppProps, NextWebVitalsMetric } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { ReactElement, useMemo } from 'react';
import { DehydratedState } from '@tanstack/react-query';
import '../styles/styles.css';
import '../styles/page-loader.css';
import 'shepherd.js/dist/css/shepherd.css';
import { logger } from '@/logger';
import { sendGTMEvent } from '@next/third-parties/google';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';
// Not the barrel: it re-exports VizPageLayout, which drags the charts
// (@nivo/*, CJS, so nothing shakes out) into every page.
import { Layout } from '@/components/Layout/Layout';
import { AppModeRouter, SettingsSync, UserSync } from '@/components/AppChrome';
import { Providers } from '@/providers';
import { PagesRouterCompatProvider } from '@/lib/useRouterCompat';

if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../mocks');
}

if (typeof window !== 'undefined' && process.env.TURBOPACK) {
  // Turbopack (default in Next.js 16 dev) bypasses the Sentry webpack plugin.
  // 'auto' = default Turbopack, '1' = explicit --turbopack. Both are truthy.
  // In production/webpack builds, TURBOPACK is undefined so this never fires.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../sentry.client.config');
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
  cookies?: string;
  [key: string]: unknown;
};

function NectarApp({ Component, pageProps }: AppProps): ReactElement {
  logger.debug('App', { props: pageProps as unknown });
  const router = useRouter();

  useMemo(() => {
    router.prefetch = () => Promise.resolve();
  }, [router]);

  return (
    <>
      <Head>
        <title>{BRAND_NAME_FULL}</title>
        <DefaultMeta />
      </Head>
      <Providers
        cookies={(pageProps as AppPageProps).cookies}
        dehydratedAppState={(pageProps as AppPageProps).dehydratedAppState}
        dehydratedState={(pageProps as AppPageProps).dehydratedState}
      >
        <PagesRouterCompatProvider>
          <AppModeRouter />
          <TopProgressBar />
          <UserSync />
          <SettingsSync />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </PagesRouterCompatProvider>
      </Providers>
    </>
  );
}

NectarApp.displayName = 'NectarApp';

NectarApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      cookies: appContext.ctx.req?.headers.cookie ?? '',
    },
  };
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
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
    </>
  );
};

export default NectarApp;
