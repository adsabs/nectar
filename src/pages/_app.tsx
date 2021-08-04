import { Layout } from '@components';
import { AppProvider } from '@store';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import 'nprogress/nprogress.css';
// import 'public/katex/katex.css';
import React, { FC } from 'react';
import 'tailwindcss/tailwind.css';
import '../styles/styles.css';

const TopProgressBar = dynamic(() => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar), {
  ssr: false,
});

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <AppProvider>
      <TopProgressBar />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProvider>
  );
};

export default NectarApp;
