import Layout from '@components/layout';
import { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
import { RecoilRoot } from 'recoil';
import useDarkMode from 'use-dark-mode';
import '../styles/index.css';

const NectarApp = ({ Component, pageProps }: AppProps) => {
  const { value: isDark } = useDarkMode(false);

  return (
    <>
      <Head>
        <title>Nectar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <RecoilRoot>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RecoilRoot>
    </>
  );
};

export default NectarApp;
