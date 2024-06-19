import 'nprogress/nprogress.css';
import '../styles/styles.css';

import { DehydratedState } from '@tanstack/react-query';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import { ReactElement } from 'react';

import { AppState } from '@/store';
export type AppPageProps = {
  dehydratedState: DehydratedState;
  dehydratedAppState: AppState;
  [key: string]: unknown;
};
declare const NectarApp: import('react').MemoExoticComponent<({ Component, pageProps }: AppProps) => ReactElement>;
export declare const reportWebVitals: (metric: NextWebVitalsMetric) => void;
export default NectarApp;
