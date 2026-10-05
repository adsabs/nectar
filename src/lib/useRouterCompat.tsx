'use client';

import type { ParsedUrlQuery } from 'querystring';
import { ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter as useAppRouter, useSearchParams } from 'next/navigation';
import { useRouter as usePagesRouter } from 'next/router';
import { RouterCompat, RouterCompatContext, RouterCompatNavigateOptions } from '@/lib/routerCompatContext';

export type { RouterCompat, RouterCompatNavigateOptions } from '@/lib/routerCompatContext';
export { RouterCompatContext } from '@/lib/routerCompatContext';

export const useRouterCompat = (): RouterCompat => {
  const ctx = useContext(RouterCompatContext);
  if (!ctx) {
    throw new Error('useRouterCompat must be used within a RouterCompatProvider');
  }
  return ctx;
};

const searchParamsToQuery = (searchParams: URLSearchParams): ParsedUrlQuery => {
  const query: ParsedUrlQuery = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }
  return query;
};

const useNavigateListeners = () => {
  const listenersRef = useRef<Set<() => void>>(new Set());

  const onNavigate = useCallback((cb: () => void) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  const notify = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  return { onNavigate, notify };
};

export const PagesRouterCompatProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const router = usePagesRouter();
  const { onNavigate: onNavigateStart, notify } = useNavigateListeners();
  const { onNavigate: onNavigateComplete, notify: notifyComplete } = useNavigateListeners();
  const { onNavigate: onNavigateError, notify: notifyError } = useNavigateListeners();

  useEffect(() => {
    router.events.on('beforeHistoryChange', notify);
    router.events.on('routeChangeComplete', notifyComplete);
    router.events.on('routeChangeError', notifyError);
    return () => {
      router.events.off('beforeHistoryChange', notify);
      router.events.off('routeChangeComplete', notifyComplete);
      router.events.off('routeChangeError', notifyError);
    };
  }, [router.events, notify, notifyComplete, notifyError]);

  const asPath = router.asPath;
  const { pathname, searchParams } = useMemo(() => {
    const withoutHash = asPath.split('#')[0];
    const qIndex = withoutHash.indexOf('?');
    return {
      pathname: qIndex === -1 ? withoutHash : withoutHash.slice(0, qIndex),
      searchParams: new URLSearchParams(qIndex === -1 ? '' : withoutHash.slice(qIndex)),
    };
  }, [asPath]);

  const push = useCallback(
    (url: string, opts?: RouterCompatNavigateOptions) => {
      void router.push(url, undefined, { scroll: opts?.scroll, shallow: opts?.shallow });
    },
    [router],
  );

  const replace = useCallback(
    (url: string, opts?: RouterCompatNavigateOptions) => {
      void router.replace(url, undefined, { scroll: opts?.scroll, shallow: opts?.shallow });
    },
    [router],
  );

  const searchQuery = useMemo(() => searchParamsToQuery(searchParams), [searchParams]);

  const value = useMemo<RouterCompat>(
    () => ({
      pathname,
      searchParams,
      query: router.query,
      searchQuery,
      asPath,
      push,
      replace,
      onNavigateStart,
      onNavigateComplete,
      onNavigateError,
    }),
    [
      pathname,
      searchParams,
      router.query,
      searchQuery,
      asPath,
      push,
      replace,
      onNavigateStart,
      onNavigateComplete,
      onNavigateError,
    ],
  );

  return <RouterCompatContext.Provider value={value}>{children}</RouterCompatContext.Provider>;
};

export const AppRouterCompatProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appRouter = useAppRouter();
  const { onNavigate: onNavigateStart, notify } = useNavigateListeners();
  const { onNavigate: onNavigateComplete, notify: notifyComplete } = useNavigateListeners();
  const hasNavigatedRef = useRef(false);
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      return;
    }
    notify();
    notifyComplete();
  }, [pathname, searchParamsString, notify, notifyComplete]);

  const query = useMemo(() => searchParamsToQuery(searchParams), [searchParams]);
  const asPath = useMemo(
    () => (searchParamsString ? `${pathname}?${searchParamsString}` : pathname),
    [pathname, searchParamsString],
  );

  const push = useCallback(
    (url: string, opts?: RouterCompatNavigateOptions) => {
      if (opts?.shallow) {
        window.history.pushState(null, '', url);
        return;
      }
      appRouter.push(url, { scroll: opts?.scroll });
    },
    [appRouter],
  );

  const replace = useCallback(
    (url: string, opts?: RouterCompatNavigateOptions) => {
      if (opts?.shallow) {
        window.history.replaceState(null, '', url);
        return;
      }
      appRouter.replace(url, { scroll: opts?.scroll });
    },
    [appRouter],
  );

  const value = useMemo<RouterCompat>(
    () => ({
      pathname,
      searchParams,
      query,
      searchQuery: query,
      asPath,
      push,
      replace,
      onNavigateStart,
      onNavigateComplete,
    }),
    [pathname, searchParams, query, asPath, push, replace, onNavigateStart, onNavigateComplete],
  );

  return <RouterCompatContext.Provider value={value}>{children}</RouterCompatContext.Provider>;
};
