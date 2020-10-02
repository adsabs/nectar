import Layout from '@components/Layout';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
import { RecoilRoot } from 'recoil';
import useDarkMode from 'use-dark-mode';

const NectarApp = ({ Component, pageProps }: AppProps) => {
  // React.useEffect(() => {
  //   // Remove the server-side injected CSS.
  //   const jssStyles = document.querySelector('#jss-server-side');
  //   if (jssStyles) {
  //     jssStyles.parentElement?.removeChild(jssStyles);
  //   }
  // }, []);

  const { value: isDark } = useDarkMode(false);

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: isDark ? 'dark' : 'light',
        },
      }),
    [isDark]
  );

  // const theme = isDark ? darkTheme : lightTheme;

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
        <RecoilRoot>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </RecoilRoot>
      </ThemeProvider>
    </>
  );
};

export default NectarApp;
