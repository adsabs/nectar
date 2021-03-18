import { Layout } from '@nectar/components';
import { RootMachineProvider } from '@nectar/context';
import { AppProps } from 'next/app';
import React, { FC } from 'react';
import '../../styles/index.css';

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <RootMachineProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </RootMachineProvider>
  );
};

export default NectarApp;
