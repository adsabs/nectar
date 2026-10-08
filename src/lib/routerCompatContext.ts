import type { ParsedUrlQuery } from 'querystring';
import { createContext } from 'react';

export interface RouterCompatNavigateOptions {
  scroll?: boolean;
  shallow?: boolean;
}

export interface RouterCompat {
  pathname: string;
  searchParams: URLSearchParams;
  query: ParsedUrlQuery;
  searchQuery: ParsedUrlQuery;
  asPath: string;
  push: (url: string, opts?: RouterCompatNavigateOptions) => void;
  replace: (url: string, opts?: RouterCompatNavigateOptions) => void;
  onNavigateStart: (cb: () => void) => () => void;
  onNavigateComplete: (cb: () => void) => () => void;
  onNavigateError?: (cb: () => void) => () => void;
}

export const RouterCompatContext = createContext<RouterCompat | null>(null);
