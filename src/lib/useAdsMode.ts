import { useCallback } from 'react';
import { sendGTMEvent } from '@next/third-parties/google';
import * as Sentry from '@sentry/nextjs';
import { useStore } from '@/store';
import { AppMode } from '@/types';
import { appModeToDisciplineParam, syncUrlDisciplineParam } from '@/utils/appMode';
import { useRouter } from 'next/router';

type AdsModeSource = 'navbar' | 'account_menu' | 'home' | 'classic_form' | 'paper_form' | string | undefined;

export const useAdsMode = () => {
  const active = useStore((state) => state.adsMode.active);
  const setAdsMode = useStore((state) => state.setAdsMode);
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const dismissModeNotice = useStore((state) => state.dismissModeNotice);
  const urlModeOverride = useStore((state) => state.urlModeOverride);
  const setUrlModeUserSelected = useStore((state) => state.setUrlModeUserSelected);
  const setUrlModePendingParam = useStore((state) => state.setUrlModePendingParam);
  const setUrlModeOverride = useStore((state) => state.setUrlModeOverride);
  const setUrlModePrevious = useStore((state) => state.setUrlModePrevious);
  const router = useRouter();

  const enable = useCallback(
    (source?: AdsModeSource) => {
      setAdsMode(true);
      if (mode !== AppMode.ASTROPHYSICS && !urlModeOverride) {
        setUrlModeUserSelected(true);
        setUrlModePendingParam(appModeToDisciplineParam(AppMode.ASTROPHYSICS));
        setUrlModeOverride(null);
        setUrlModePrevious(mode);
        setMode(AppMode.ASTROPHYSICS);
        dismissModeNotice();
        void syncUrlDisciplineParam(router, AppMode.ASTROPHYSICS);
      }
      sendGTMEvent({
        event: 'ads_mode_enabled',
        ads_mode: true,
        source,
      });
      Sentry.addBreadcrumb({
        category: 'ads_mode',
        message: 'ADS mode enabled',
        level: 'info',
        data: { source },
      });
    },
    [
      setAdsMode,
      mode,
      urlModeOverride,
      setUrlModeUserSelected,
      setUrlModePendingParam,
      setUrlModeOverride,
      setUrlModePrevious,
      setMode,
      dismissModeNotice,
      router,
    ],
  );

  const disable = useCallback(
    (source?: AdsModeSource) => {
      setAdsMode(false);
      sendGTMEvent({
        event: 'ads_mode_disabled',
        ads_mode: false,
        source,
      });
      Sentry.addBreadcrumb({
        category: 'ads_mode',
        message: 'ADS mode disabled',
        level: 'info',
        data: { source },
      });
    },
    [setAdsMode],
  );

  const toggle = useCallback(
    (source?: AdsModeSource) => {
      if (active) {
        disable(source);
      } else {
        enable(source);
      }
    },
    [active, disable, enable],
  );

  return {
    active,
    enable,
    disable,
    toggle,
  };
};
