import { Layout } from '@components';
import { AppProvider, useAppCtx } from '@store';
import { Theme } from '@types';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
// import 'public/katex/katex.css';
import React, { FC, useEffect } from 'react';
import 'tailwindcss/tailwind.css';
import '../styles/styles.css';

const TopProgressBar = dynamic(() => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar), {
  ssr: false,
});

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <AppProvider>
      <ThemeRouter />
      <TopProgressBar />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProvider>
  );
};

const ThemeRouter = (): React.ReactElement => {
  const { state } = useAppCtx();
  const router = useRouter();

  useEffect(() => {
    // redirect to main form if path is not valid
    if (typeof window !== 'undefined') {
      if (
        state.theme !== Theme.ASTROPHYSICS &&
        (router.asPath === '/classic-form' || router.asPath === '/paper-form')
      ) {
        void router.replace('/');
      }
    }
  }, [state.theme, router.asPath]);

  return <></>;
};

export default NectarApp;
