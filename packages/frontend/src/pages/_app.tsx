import { AppProps } from 'next/app';
import React, { FC } from 'react';
import 'tailwindcss/tailwind.css';
import { RootMachineProvider } from '../context';

const NectarApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <RootMachineProvider>
      <Component {...pageProps} />
    </RootMachineProvider>
  );
};

export default NectarApp;
