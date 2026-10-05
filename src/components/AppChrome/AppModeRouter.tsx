'use client';

import { ReactElement, useEffect } from 'react';

import { AppMode } from '@/types';
import { useIsClient } from '@/lib/useIsClient';
import { useRouterCompat } from '@/lib/useRouterCompat';
import { useStore, useStoreApi } from '@/store';

export const AppModeRouter = (): ReactElement => {
  const storeApi = useStoreApi();
  const setMode = useStore((state) => state.setMode);
  const setForcedAstroFromMode = useStore((state) => state.setForcedAstroFromMode);
  const showModeNotice = useStore((state) => state.showModeNotice);
  const dismissModeNotice = useStore((state) => state.dismissModeNotice);
  const router = useRouterCompat();
  const isClient = useIsClient();

  useEffect(() => {
    // Classic/paper forms are Astrophysics-only, so a user in another
    // discipline is switched over with a "Switch back?" notice rather than
    // bounced to the home page.
    if (!isClient) {
      return;
    }
    // Matches /classic-form or /paper-form with an optional query/hash
    // suffix, not lookalikes such as /classic-former.
    const onFormRoute = /^\/(classic|paper)-form(?:[/?#]|$)/.test(router.asPath);
    const { mode, forcedAstroFromMode } = storeApi.getState();

    // Leaving the form route without acting on the notice: clear it so it
    // doesn't linger on unrelated routes.
    if (!onFormRoute) {
      if (forcedAstroFromMode !== null) {
        setForcedAstroFromMode(null);
        dismissModeNotice();
      }
      return;
    }

    if (mode !== AppMode.ASTROPHYSICS) {
      setForcedAstroFromMode(mode);
      setMode(AppMode.ASTROPHYSICS);
      showModeNotice();
    }
  }, [router.asPath, isClient, storeApi, setMode, setForcedAstroFromMode, showModeNotice, dismissModeNotice]);

  // forceMode is only needed for the initial SSR load; leaving it in the
  // URL would break bookmarking and sharing.
  useEffect(() => {
    if (isClient) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('forceMode')) {
        url.searchParams.delete('forceMode');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [isClient]);

  return <></>;
};
