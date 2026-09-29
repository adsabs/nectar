import { ToastId, useToast } from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'next/router';
import { stripNotifyParam } from './stripNotifyParam';

const TIMEOUT = 10000;

export const Notification = () => {
  const toastId = useRef<ToastId>(null);
  const router = useRouter();
  const timeoutId = useRef<NodeJS.Timeout>(null);
  const notification = useStore((state) => state.notification);
  const resetNotification = useStore((state) => state.resetNotification);
  const toast = useToast({
    duration: TIMEOUT,
  });

  // Reset notification (clear from store and close toast)
  const reset = useCallback(() => {
    resetNotification();
    clearTimeout(timeoutId.current);
    if (toastId.current) {
      toast.close(toastId.current);
    }
  }, [resetNotification, toast, toastId.current, timeoutId.current]);

  // Show notification
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

  // replaceState: a route change would fire the reset below and close the toast.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const { pathname, search, hash } = window.location;
    const stripped = stripNotifyParam(`${pathname}${search}${hash}`);
    if (stripped !== `${pathname}${search}${hash}`) {
      window.history.replaceState(window.history.state, '', stripped);
    }
  }, [notification]);

  // Reset notification on route change
  useEffect(() => {
    router.events.on('routeChangeStart', reset);
    router.events.on('routeChangeComplete', reset);
    router.events.on('routeChangeError', reset);
    return () => {
      router.events.off('routeChangeStart', reset);
      router.events.off('routeChangeComplete', reset);
      router.events.off('routeChangeError', reset);
    };
  }, [router, reset]);

  return <></>;
};
