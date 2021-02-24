import { AppProps } from 'next/app';
import React, { FC } from 'react';
import 'tailwindcss/tailwind.css';

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => (
  <div>
    <Component {...pageProps} />
  </div>
);

export default NectarApp;
