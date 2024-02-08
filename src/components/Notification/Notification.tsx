import { useToast } from '@chakra-ui/react';
import React, { useCallback, useEffect } from 'react';
import { useStore } from '@store';
import { useRouter } from 'next/router';
import { NotificationId } from '@store/slices';

const TIMEOUT = 5000;

export const Notification = () => {
  const notification = useStore((state) => state.notification);
  const setNotification = useStore((state) => state.setNotification);
  const resetNotification = useStore((state) => state.resetNotification);
  const toast = useToast({
    position: 'top',
    duration: TIMEOUT,
    isClosable: true,
    variant: 'subtle',
  });

  const router = useRouter();

  useEffect(() => {
    if (router.query?.notify && !notification) {
      setNotification(router.query.notify as NotificationId);
    }
  }, [router.asPath, notification]);

  const reset = useCallback(() => {
    const [root, query = ''] = router.asPath.split('?');
    const params = new URLSearchParams(query);

    // remove the notify query param
    params.delete('notify');
    const newQuery = params.toString() ? `?${params.toString()}` : '';
    const as = `${root}${newQuery}`;

    // update the url without triggering a page refresh
    router.replace(as, as, { shallow: true }).finally(() => {
      resetNotification();
    });
  }, [router.asPath]);

  // clear notification after timeout
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;

    if (notification !== null) {
      id = setTimeout(reset, TIMEOUT);
    }
    return () => clearTimeout(id);
  }, [notification]);

  useEffect(() => {
    if (notification !== null && !toast.isActive(notification?.id)) {
      toast({
        id: notification?.id,
        description: notification?.message,
        status: notification?.status,
        onCloseComplete: reset,
      });
    }
  }, [notification]);

  return <></>;
};
