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
import { useRouter } from 'next/router';
import {
  PERF_SPANS,
  getResultCountBucket,
  getQueryType,
  openFullTextTimingSpan,
  closeFullTextTimingSpan,
  sendQueryAsTags,
} from '@/lib/performance';
import { parseQueryFromUrl } from '@/utils/common/search';
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
  const router = useRouter();
  // URL is the source of truth for the submitted query; a change in the
  // /search URL is a search submission (replaces the store's latestQuery)
  const searchPath = router.pathname === '/search' ? router.asPath : null;
  const user = useStore((state) => state.user, shallow);
  const docs = useStore((state) => state.docs.current, shallow);
  const searchSpanRef = useRef<ReturnType<typeof Sentry.startInactiveSpan> | null>(null);
  const paginationSpanRef = useRef<ReturnType<typeof Sentry.startInactiveSpan> | null>(null);

  useGlobalErrorHandler();

  useEffect(() => {
    try {
      if (!user) {
        // Clear any prior user context so post-logout events are not misclassified.
        Sentry.setUser(null);
        return;
      }
      // Never send credentials or PII — anonymous flag is enough to segment error rates.
      Sentry.setUser({ anonymous: user.anonymous });
    } catch (err) {
      logger.error({ err }, 'Telemetry: setUser error');
    }
  }, [user]);

  useEffect(() => {
    if (!searchPath) {
      return;
    }
    // The search page stamps resolved sort/rows into arriving URLs with a
    // replace navigation; skip the transient pre-stamp URL so a single search
    // submission opens one span instead of two.
    const urlParams = new URLSearchParams(searchPath.split('?')[1] ?? '');
    if (!urlParams.has('sort') || !urlParams.has('rows')) {
      return;
    }
    try {
      const query = parseQueryFromUrl(searchPath);
      sendQueryAsTags(query);
      const page = query.p ?? 1;
      // End prior spans so rapid re-submits don't leak them.
      searchSpanRef.current?.end();
      searchSpanRef.current = null;
      paginationSpanRef.current?.end();
      paginationSpanRef.current = null;
      closeFullTextTimingSpan();
      // Open here: the nav transaction's idle timeout fires before docs arrive.
      searchSpanRef.current = Sentry.startInactiveSpan({
        name: PERF_SPANS.SEARCH_SUBMIT_TOTAL,
        op: 'user.flow',
        attributes: { query_type: getQueryType(query.q ?? ''), page },
      });
      if (page > 1) {
        paginationSpanRef.current = Sentry.startInactiveSpan({
          name: PERF_SPANS.SEARCH_PAGINATION_TOTAL,
          op: 'user.flow',
          attributes: { page },
        });
      }
    } catch (err) {
      logger.error({ err }, 'Telemetry: query span error');
    }
  }, [searchPath]);

  useEffect(() => {
    if (!docs || docs.length === 0) {
      return;
    }
    logger.debug({ count: docs.length }, 'Telemetry: docs');
    try {
      const bucket = getResultCountBucket(docs.length);
      if (searchSpanRef.current) {
        searchSpanRef.current.setAttributes({ result_count_bucket: bucket });
        searchSpanRef.current.setStatus({ code: 1 });
        searchSpanRef.current.end();
        searchSpanRef.current = null;
      }
      if (paginationSpanRef.current) {
        paginationSpanRef.current.setAttributes({ result_count_bucket: bucket });
        paginationSpanRef.current.setStatus({ code: 1 });
        paginationSpanRef.current.end();
        paginationSpanRef.current = null;
      }
      openFullTextTimingSpan();
    } catch (err) {
      logger.error({ err }, 'Telemetry: docs span error');
    }
  }, [docs]);

  return <></>;
};
