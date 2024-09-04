import 'nprogress/nprogress.css';
import '../styles/styles.css';
import '../styles/page-loader.css';

import { Box, ChakraProvider, Flex, Skeleton, Stack } from '@chakra-ui/react';
import { GoogleTagManager, sendGTMEvent } from '@next/third-parties/google';
import { DehydratedState, Hydrate, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC, ReactElement, useEffect, useState } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useIsClient } from 'src/lib';

import { AbsSkeleton, Layout, ListActions, LoadingMessage, SearchBar, SimpleResultListSkeleton } from '@/components';
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
        <PageSkeleton pageProps={pageProps}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </PageSkeleton>
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
                <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID ?? ''} />
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

const PageSkeleton: FC<{ pageProps: Record<string, unknown> }> = ({ children, pageProps }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [incomingRoute, setIncomingRoute] = useState<string>(router.asPath);

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      if (url !== incomingRoute) {
        setIsLoading(true);
        setIncomingRoute(url);
      }
    };

    const handleRouteChangeComplete = (url: string) => {
      if (url === incomingRoute) {
        setIsLoading(false);
      }
    };

    const handleRouteChangeError = () => {
      setIsLoading(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router, incomingRoute]);

  if (!isLoading) {
    return <>{children}</>;
  }

  if (incomingRoute?.startsWith('/abs')) {
    const path = getLastSegmentOfRoute(incomingRoute);
    return (
      <Layout>
        <AbsSkeleton path={path ?? 'abstract'} />
      </Layout>
    );
  } else if (incomingRoute?.startsWith('/search')) {
    return (
      <Layout>
        <SearchBar w="full" />
        <Box w="full">
          <ListActions isLoading />
        </Box>
        <Flex w="full" mt="4">
          <FilterSidebarSkeleton />
          <SimpleResultListSkeleton />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoadingMessage message="Loading..." my={16} />
    </Layout>
  );
};

const getLastSegmentOfRoute = (route = '/') => {
  // Remove query string and trailing slash, then split
  const segments = route.split('?')[0].replace(/\/$/, '').split('/');
  if (segments.includes('exportcitation')) {
    // this is the only details page route that has a path below it
    return 'exportcitation';
  }
  return segments.length > 1 ? segments.pop() : null;
};

const FilterSidebarSkeleton = () => {
  return (
    <Box w="250px" p={4} borderRight="1px solid #e2e8f0">
      <Stack spacing={4}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Box key={index}>
            <Skeleton height="20px" width="90%" />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
