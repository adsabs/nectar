import { ChakraProvider } from '@chakra-ui/react';
import { Layout } from '@components';
import { useCreateQueryClient } from '@hooks/useCreateQueryClient';
import { ApiProvider } from '@providers/api';
import { AppState, StoreProvider, useCreateStore, useStore } from '@store';
import { theme } from '@theme';
import { Theme } from '@types';
import { isBrowser } from '@utils';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { FC, memo, ReactElement, useEffect } from 'react';
import { Hydrate, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import 'tailwindcss/tailwind.css';
import '../styles/styles.css';

if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
  require('@mocks');
}

const TopProgressBar = dynamic<Record<string, never>>(
  () => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar),
  {
    ssr: false,
  },
);

type AppPageProps = { dehydratedState: unknown; dehydratedAppState: AppState; [key: string]: unknown };

const NectarApp = memo(({ Component, pageProps }: AppProps): ReactElement => {
  return (
    <Providers pageProps={pageProps as AppPageProps}>
      <ThemeRouter />
      <TopProgressBar />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Providers>
  );
});

const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});

  return (
    <ChakraProvider theme={theme}>
      <StoreProvider createStore={createStore}>
        <QCProvider>
          <ApiProvider>
            <Hydrate state={pageProps.dehydratedState}>{children}</Hydrate>
            <ReactQueryDevtools />
          </ApiProvider>
        </QCProvider>
      </StoreProvider>
    </ChakraProvider>
  );
};

const QCProvider: FC = ({ children }) => {
  const queryClient = useCreateQueryClient();
  return (
    <QueryClientProvider client={queryClient} contextSharing>
      {children}
    </QueryClientProvider>
  );
};

const ThemeRouter = (): ReactElement => {
  const theme = useStore((state) => state.theme);
  const router = useRouter();

  useEffect(() => {
    // redirect to main form if path is not valid
    if (isBrowser()) {
      if (theme !== Theme.ASTROPHYSICS && /^\/(classic|paper)-form.*$/.test(router.asPath)) {
        void router.replace('/');
      }
    }
  }, [theme, router.asPath]);

  return <></>;
};

export default NectarApp;
