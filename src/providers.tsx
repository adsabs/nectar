import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { MathJaxProvider } from './mathjax';
import { ChakraProvider } from '@chakra-ui/react';
import { AppState, StoreProvider, useCreateStore, useStore } from './store';
import { DehydratedState, Hydrate, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { FC, useEffect } from 'react';
import { useCreateQueryClient } from './lib/useCreateQueryClient';
import { logger } from './logger';
import { theme } from './theme';
import shallow from 'zustand/shallow';
import * as Sentry from '@sentry/nextjs';
import { IADSApiSearchParams } from './api/search/types';

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
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
      <MathJaxProvider>
        <ChakraProvider theme={theme}>
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
      </MathJaxProvider>
    </GoogleReCaptchaProvider>
  );
};

const QCProvider: FC = ({ children }) => {
  const queryClient = useCreateQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const Telemetry: FC = () => {
  const query = useStore((state) => state.query, shallow);
  const user = useStore((state) => state.user, shallow);
  const docs = useStore((state) => state.docs.current, shallow);
  logger.debug({ query, user }, 'Telemetry');

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
        sendResultsLoaded();
      }
    } catch (err) {
      logger.error({ err }, 'Telemetry: error');
    }
  }, [query, user, docs]);

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

const sendResultsLoaded = () => {
  const loadedTime = performance.now();
  const duration = loadedTime - windowState.navigationStart;
  Sentry.setMeasurement('timing.results.shown', duration, 'millisecond');
};
