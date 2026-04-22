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
      // Close any in-flight span so rapid re-submits don't leak the prior one.
      if (searchSpanRef.current) {
        searchSpanRef.current.end();
        searchSpanRef.current = null;
      }
      // Must open here: the navigation transaction's idle timeout closes before docs arrive.
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
    } catch (err) {
      logger.error({ err }, 'Telemetry: docs span error');
    }
  }, [docs]);

  return <></>;
};

const sendQueryAsTags = (query: IADSApiSearchParams) => {
  Object.keys(query).forEach((key) => {
    const raw = query[key];
    Sentry.setTag(`query.${key}`, Array.isArray(raw) ? raw.join(' | ') : JSON.stringify(raw));
  });
};
