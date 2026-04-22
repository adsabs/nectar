import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { MathJaxProvider } from './mathjax';
import { ChakraProvider } from '@chakra-ui/react';
import { AppState, StoreProvider, useCreateStore, useStore } from './store';
import { DehydratedState, Hydrate, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { FC, useEffect, useRef } from 'react';
import { useCreateQueryClient } from './lib/useCreateQueryClient';
import { logger } from './logger';
import { theme } from './theme';
import shallow from 'zustand/shallow';
import * as Sentry from '@sentry/nextjs';
import { IADSApiSearchParams } from './api/search/types';
import { PERF_SPANS, getResultCountBucket, getQueryType } from '@/lib/performance';
import { useGlobalErrorHandler } from './lib/useGlobalErrorHandler';
import { ShepherdJourneyProvider } from 'react-shepherd';

type AppPageProps = {
  dehydratedState: DehydratedState;
  dehydratedAppState: AppState;
  [key: string]: unknown;
};

export const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});

  return (
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
  );
};

const QCProvider: FC = ({ children }) => {
  const queryClient = useCreateQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const Telemetry: FC = () => {
  const latestQuery = useStore((state) => state.latestQuery, shallow);
  const user = useStore((state) => state.user, shallow);
  const docs = useStore((state) => state.docs.current, shallow);
  const searchSpanRef = useRef<ReturnType<typeof Sentry.startInactiveSpan> | null>(null);

  useGlobalErrorHandler();

  useEffect(() => {
    if (!user) {
      return;
    }
    try {
      Sentry.setUser({ id: user.access_token, anonymous: user.anonymous });
    } catch (err) {
      logger.error({ err }, 'Telemetry: setUser error');
    }
  }, [user]);

  useEffect(() => {
    if (!latestQuery) {
      return;
    }
    try {
      sendQueryAsTags(latestQuery);
      // End any in-flight span before starting a new one — prevents leaking
      // the previous span if the user submits a second query before docs arrive.
      if (searchSpanRef.current) {
        searchSpanRef.current.end();
        searchSpanRef.current = null;
      }
      // Open the span while the navigation transaction is still active.
      // Closing it happens in the docs effect, but by then the transaction's
      // idle timeout has already fired — so we must open here, not there.
      searchSpanRef.current = Sentry.startInactiveSpan({
        name: PERF_SPANS.SEARCH_SUBMIT_TOTAL,
        op: 'user.flow',
        attributes: { query_type: getQueryType(latestQuery.q ?? '') },
      });
    } catch (err) {
      logger.error({ err }, 'Telemetry: query span error');
    }
  }, [latestQuery]);

  useEffect(() => {
    if (!docs || docs.length === 0) {
      return;
    }
    logger.debug({ docs }, 'Telemetry: docs');
    try {
      if (searchSpanRef.current) {
        searchSpanRef.current.setAttributes({ result_count_bucket: getResultCountBucket(docs.length) });
        searchSpanRef.current.setStatus({ code: 1 });
        searchSpanRef.current.end();
        searchSpanRef.current = null;
      }
      Sentry.setMeasurement('timing.results.shown', performance.now(), 'millisecond');
    } catch (err) {
      logger.error({ err }, 'Telemetry: docs span error');
    }
  }, [docs]);

  return <></>;
};

const sendQueryAsTags = (query: IADSApiSearchParams) => {
  Object.keys(query).forEach((key) => {
    const value = JSON.stringify(query[key]);
    if (Array.isArray(value)) {
      Sentry.setTag(`query.${key}`, value.join(' | '));
    } else {
      Sentry.setTag(`query.${key}`, value);
    }
  });
};
