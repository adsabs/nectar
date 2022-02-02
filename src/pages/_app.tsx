import { ChakraProvider } from '@chakra-ui/react';
import { Layout } from '@components';
import { ApiProvider } from '@providers/api';
import { AppProvider, useAppCtx } from '@store';
import { Theme } from '@types';
import { isBrowser } from '@utils';
import App, { AppContext, AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { ReactElement, useEffect, useState } from 'react';
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

const NectarApp = ({ Component, pageProps }: AppProps): ReactElement => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: Infinity } },
      }),
  );

  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ApiProvider>
            <Hydrate state={(pageProps as { dehydratedState: unknown }).dehydratedState}>
              <ThemeRouter />
              <TopProgressBar />
              <ToastContainer />
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </Hydrate>
            <ReactQueryDevtools />
          </ApiProvider>
        </AppProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
};

const ThemeRouter = (): ReactElement => {
  const { state } = useAppCtx();
  const router = useRouter();

  useEffect(() => {
    // redirect to main form if path is not valid
    if (isBrowser()) {
      if (state.theme !== Theme.ASTROPHYSICS && /^\/(classic|paper)-form.*$/.test(router.asPath)) {
        void router.replace('/');
      }
    }
  }, [state.theme, router.asPath]);

  return <></>;
};

NectarApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default NectarApp;
