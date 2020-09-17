import Layout from '@components/Layout';
import { CssBaseline, ThemeProvider } from '@material-ui/core';
import theme from '@theme';
import App, { AppContext, AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
import '../styles/globals.css';

const NectarApp: NextPage<AppProps> = ({ Component, pageProps }) => {
  React.useEffect(() => {
    // remove server-side injected CSS
    const jssStyles = document.querySelector('#jss-server-side');
    jssStyles?.parentElement?.removeChild(jssStyles);
  }, []);

  console.log({ pageProps });

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

NectarApp.getInitialProps = async (ctx: AppContext) => {
  console.log({ ctx });

  const appProps = await App.getInitialProps(ctx);
  return {
    ...appProps,
  };
};

// export const getServerSideProps: GetServerSideProps = async (
//   ctx: GetServerSidePropsContext
// ) => {
//   console.log('server side get props!', ctx);
//   return { props: { foo: 'bar' } };
// };

// export const getStaticProps: GetStaticProps = async (
//   ctx: GetStaticPropsContext
// ) => {
//   console.log('server static side get props!', ctx);

//   return {
//     test: 'foo',
//     props: {},
//   };
// };

export default NectarApp;
