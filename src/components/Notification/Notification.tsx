import { useToast } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useStore } from '@store';
import { useRouter } from 'next/router';
import { NotificationId } from '@store/slices';

const TIMEOUT = 3000;

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
    const [, query = ''] = router.asPath.split('?');
    const params = new URLSearchParams(query);

    if (params.has('notify') && notification === null) {
      setNotification(params.get('notify') as NotificationId);
    }
  }, [router.asPath, notification]);

  useEffect(() => {
    if (notification !== null && !toast.isActive(notification?.id)) {
      toast({
        id: notification?.id,
        description: notification?.message,
        status: notification?.status,
        onCloseComplete: resetNotification,
      });
    }
  }, [notification, resetNotification, toast]);

  return <></>;
};
