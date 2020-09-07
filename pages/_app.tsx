import '../styles/globals.css';
import React from 'react';
import type { AppProps } from 'next/app';
import axios from 'axios';
import Head from 'next/head';
import { ThemeProvider, CssBaseline } from '@material-ui/core';
import Layout from '@components/Layout';
import theme from '@theme';
import qs from 'qs';

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  React.useEffect(() => {
    // remove server-side injected CSS
    const jssStyles = document.querySelector('#jss-server-side');
    jssStyles?.parentElement?.removeChild(jssStyles);
  });

  axios.defaults.paramsSerializer = (params) => qs.stringify(params);
  axios.defaults.withCredentials = true;

  return (
    <>
      <Head>
        <title>Nectar</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </>
  );
};

export default MyApp;
