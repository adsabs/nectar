import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { MathJaxProvider } from './mathjax';
import { ChakraProvider } from '@chakra-ui/react';
import { NuqsAdapter } from 'nuqs/adapters/next/pages';
import { AppState, StoreProvider, useCreateStore, useStore } from './store';
import { DehydratedState, Hydrate, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { FC, useEffect } from 'react';
import { useCreateQueryClient } from './lib/useCreateQueryClient';
import { logger } from './logger';
import { theme } from './theme';
import shallow from 'zustand/shallow';
import * as Sentry from '@sentry/nextjs';
import { PERF_SPANS, getResultCountBucket, getQueryType } from '@/lib/performance';
import { useGlobalErrorHandler } from './lib/useGlobalErrorHandler';
import { ShepherdJourneyProvider } from 'react-shepherd';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';

const windowState = {
  navigationStart: performance?.timeOrigin || performance?.timing?.navigationStart || 0,
};

type AppPageProps = {
  dehydratedState: DehydratedState;
  dehydratedAppState: AppState;
  [key: string]: unknown;
};

export const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});

  return (
    <NuqsAdapter>
      <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
        <MathJaxProvider>
          <ShepherdJourneyProvider>
            <ChakraProvider
              theme={theme}
              toastOptions={{
                defaultOptions: {
                  position: 'top',
                  duration: 3000,
                  isClosable: true,
                  variant: 'subtle',
                },
              }}
            >
              <StoreProvider createStore={createStore}>
                <QCProvider>
                  <Hydrate state={pageProps.dehydratedState}>
                    <Telemetry />
                    {children}
                  </Hydrate>
                  <ReactQueryDevtools />
                </QCProvider>
              </StoreProvider>
            </ChakraProvider>
          </ShepherdJourneyProvider>
        </MathJaxProvider>
      </GoogleReCaptchaProvider>
    </NuqsAdapter>
  );
};

const QCProvider: FC = ({ children }) => {
  const queryClient = useCreateQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const Telemetry: FC = () => {
  const { query } = useRouter();
  const user = useStore((state) => state.user, shallow);
  const docs = useStore((state) => state.docs.current, shallow);

  // Initialize global error handlers
  useGlobalErrorHandler();

  useEffect(() => {
    try {
      if (user) {
        Sentry.setUser({
          id: user?.access_token,
          anonymous: user.anonymous,
        });
      }

      if (query) {
        sendQueryAsTags(query);
      }

      if (docs && docs.length > 0) {
        logger.debug({ docs }, 'Telemetry: docs');
        sendResultsLoaded(query, docs.length);
      }
    } catch (err) {
      logger.error({ err }, 'Telemetry: error');
    }
  }, [query, user, docs]);

  return <></>;
};

const sendQueryAsTags = (query: ParsedUrlQuery) => {
  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (Array.isArray(value)) {
      Sentry.setTag(`query.${key}`, value.join(' | '));
    } else {
      Sentry.setTag(`query.${key}`, JSON.stringify(value));
    }
  });
};

const sendResultsLoaded = (query: ParsedUrlQuery, docCount: number) => {
  const loadedTime = performance.now();
  const q = typeof query.q === 'string' ? query.q : '';

  // performance.now() already returns ms since navigation start
  Sentry.setMeasurement('timing.results.shown', loadedTime, 'millisecond');

  // Add new span-based tracking
  Sentry.startSpan(
    {
      name: PERF_SPANS.SEARCH_SUBMIT_TOTAL,
      op: 'user.flow',
      startTime: windowState.navigationStart / 1000,
      attributes: {
        query_type: getQueryType(q),
        result_count_bucket: getResultCountBucket(docCount),
      },
    },
    (span) => {
      span.end((windowState.navigationStart + loadedTime) / 1000);
    },
  );
};
