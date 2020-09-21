import Layout from '@components/Layout';
import { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
import '../styles/index.scss';

const NectarApp = ({ Component, pageProps }: AppProps) => {
  console.log({ pageProps });

  return (
    <>
      <Head>
        <title>Nectar</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
};

export default NectarApp;
