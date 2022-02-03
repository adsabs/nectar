import { ChakraProvider } from '@chakra-ui/react';
import { Layout } from '@components';
import { ApiProvider } from '@providers/api';
import { AppState, StoreProvider, useCreateStore, useStore } from '@store';
import { Theme } from '@types';
import { isBrowser } from '@utils';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { FC, ReactElement, useEffect, useState } from 'react';
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'tailwindcss/tailwind.css';
import '../styles/styles.css';
import theme from '../theme';

const TopProgressBar = dynamic(() => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar), {
  ssr: false,
});

type AppPageProps = { dehydratedState: unknown; dehydratedAppState: AppState; [key: string]: unknown };

const NectarApp = ({ Component, pageProps }: AppProps): ReactElement => {
  return (
    <Providers pageProps={pageProps as AppPageProps}>
      <ThemeRouter />
      <TopProgressBar />
      <ToastContainer />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Providers>
  );
};

const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: Infinity } },
      }),
  );

  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});

  return (
    <StoreProvider createStore={createStore}>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <ChakraProvider theme={theme}>
            <Hydrate state={pageProps.dehydratedState}>{children}</Hydrate>
            <ReactQueryDevtools />
          </ChakraProvider>
        </ApiProvider>
      </QueryClientProvider>
    </StoreProvider>
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
