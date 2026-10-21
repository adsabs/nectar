import { ToastId, useToast } from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useRouterCompat } from '@/lib/useRouterCompat';
import { stripNotifyParam } from './stripNotifyParam';

const TIMEOUT = 10000;

// URL match alone can't tell a self-caused strip from a genuine nav to the
// same URL (pages router fires one); this grace window disambiguates by time.
export const SELF_STRIP_GRACE_MS = 250;

export const Notification = () => {
  const toastId = useRef<ToastId>(null);
  const router = useRouterCompat();
  const timeoutId = useRef<NodeJS.Timeout>(null);
  const selfStrippedUrlRef = useRef<string | null>(null);
  const selfStrippedAtRef = useRef<number>(0);
  const notification = useStore((state) => state.notification);
  const resetNotification = useStore((state) => state.resetNotification);
  const toast = useToast({
    duration: TIMEOUT,
  });

  const reset = useCallback(() => {
    resetNotification();
    clearTimeout(timeoutId.current);
    if (toastId.current) {
      toast.close(toastId.current);
    }
  }, [resetNotification, toast, toastId.current, timeoutId.current]);

  useEffect(() => {
    if (notification !== null && !toast.isActive(toastId.current)) {
      clearTimeout(timeoutId.current);
      toastId.current = toast({
        id: notification?.id,
        description: notification?.message,
        status: notification?.status,
        onCloseComplete: resetNotification,
      });
    }
    return () => {
      timeoutId.current = setTimeout(reset, TIMEOUT);
    };
  }, [notification, resetNotification, toast, toastId.current, reset]);

  // replaceState: under the app router this counts as a navigation, which
  // would otherwise fire the reset below and close the toast within a tick.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const { pathname, search, hash } = window.location;
    const current = `${pathname}${search}${hash}`;
    const stripped = stripNotifyParam(current);
    if (stripped !== current) {
      selfStrippedUrlRef.current = stripped;
      selfStrippedAtRef.current = Date.now();
      window.history.replaceState(window.history.state, '', stripped);
    }
  }, [notification]);

  // Reset notification on route change, unless it's the navigation our own
  // param strip above produced.
  useEffect(() => {
    return router.onNavigateStart(() => {
      const armedUrl = selfStrippedUrlRef.current;
      const armedAt = selfStrippedAtRef.current;
      selfStrippedUrlRef.current = null;

      if (armedUrl !== null && Date.now() - armedAt <= SELF_STRIP_GRACE_MS && typeof window !== 'undefined') {
        const { pathname, search, hash } = window.location;
        if (armedUrl === `${pathname}${search}${hash}`) {
          return;
        }
      }

      reset();
    });
  }, [router, reset]);

  useEffect(() => {
    if (!router.onNavigateError) {
      return;
    }
    return router.onNavigateError(reset);
  }, [router, reset]);

  return <></>;
};
