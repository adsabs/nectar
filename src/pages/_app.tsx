import { Layout } from '@components';
import { rootService } from '@machines';
import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import 'nprogress/nprogress.css';
// import 'public/katex/katex.css';
import React, { FC } from 'react';
import 'tailwindcss/tailwind.css';

const TopProgressBar = dynamic(() => import('@components/TopProgressBar').then((mod) => mod.TopProgressBar), {
  ssr: false,
});

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <TopProgressBar />
      <Layout>
        <Component {...pageProps} service={rootService} />
      </Layout>
    </>
  );
};

export default NectarApp;
