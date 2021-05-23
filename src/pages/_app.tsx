import { Layout } from '@components';
import { rootService } from '@machines';
import { AppProps } from 'next/app';
import React, { FC } from 'react';
import 'tailwindcss/tailwind.css';

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <Layout service={rootService}>
      <Component {...pageProps} service={rootService} />
    </Layout>
  );
};

export default NectarApp;
