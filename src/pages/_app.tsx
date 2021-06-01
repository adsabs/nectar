import { Layout } from '@components';
import { rootService } from '@machines';
import { AppProps } from 'next/app';
// import 'public/katex/katex.css';
import React, { FC } from 'react';
import 'tailwindcss/tailwind.css';

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <Layout>
      <Component {...pageProps} service={rootService} />
    </Layout>
  );
};

export default NectarApp;
