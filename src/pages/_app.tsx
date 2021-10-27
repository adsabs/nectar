import { Layout } from '@components';
import { ApiProvider } from '@providers/api';
import { AppProvider, useAppCtx } from '@store';
import { Theme } from '@types';
import { isBrowser } from '@utils';
import type { IncomingMessage } from 'http';
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

const TopProgressBar = dynamic(() => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar), {
  ssr: false,
});

type NectarAppProps = {
  session: IncomingMessage['session'];
} & AppProps;

const NectarApp = ({ Component, pageProps, session }: NectarAppProps): ReactElement => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: Infinity } },
      }),
  );

  return (
    <AppProvider session={session}>
      <ApiProvider>
        <QueryClientProvider client={queryClient}>
          <Hydrate state={(pageProps as { dehydratedState: unknown }).dehydratedState}>
            <ThemeRouter />
            <TopProgressBar />
            <ToastContainer />
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Hydrate>
          <ReactQueryDevtools />
        </QueryClientProvider>
      </ApiProvider>
    </AppProvider>
  );
};

NectarApp.getInitialProps = async (appContext: AppContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  // pass session data through to App component
  return { ...appProps, session: appContext.ctx.req?.session };
};

const ThemeRouter = (): ReactElement => {
  const { state } = useAppCtx();
  const router = useRouter();

  useEffect(() => {
    // redirect to main form if path is not valid
    if (isBrowser()) {
      if (state.theme !== Theme.ASTROPHYSICS && /\/(classic|paper)-form/.test(router.asPath)) {
        void router.replace('/');
      }
    }
  }, [state.theme, router.asPath]);

  return <></>;
};

export default NectarApp;
