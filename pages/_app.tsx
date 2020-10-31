import Layout from '@components/Layout';
import { ThemeProvider } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import appTheme from '@theme';
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
    () => ({ ...appTheme, palette: { ...appTheme.palette, type: 'dark' } }),
    // createMuiTheme(
    //   isDark
    //     ? { ...appTheme, palette: { ...appTheme.palette, type: 'dark' } }
    //     : { ...appTheme, palette: { ...appTheme.palette, type: 'light' } }
    // ),
    [isDark]
  );

  console.log('render', theme.palette.type);

  return (
    <>
      <Head>
        <title>Nectar</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
        <meta name="theme-color" content={theme.palette.primary.main} />
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
