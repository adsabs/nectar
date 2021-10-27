import { Layout } from '@components';
import { ApiProvider } from '@providers/api';
import { AppProvider, useAppCtx } from '@store';
import { Theme } from '@types';
import { isBrowser } from '@utils';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { ReactElement, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'tailwindcss/tailwind.css';
import '../styles/styles.css';

const TopProgressBar = dynamic(() => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar), {
  ssr: false,
});

const NectarApp = ({ Component, pageProps }: AppProps): ReactElement => {
  return (
    <AppProvider>
      <ApiProvider>
        <ThemeRouter />
        <TopProgressBar />
        <ToastContainer />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ApiProvider>
    </AppProvider>
  );
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
