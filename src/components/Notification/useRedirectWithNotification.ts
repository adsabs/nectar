import { useRouter } from 'next/router';
import { NotificationId } from '@store/slices';
import { useStore } from '@store';

interface IRedirectWithNotificationProps {
  path: string;
}

export const useRedirectWithNotification = () => {
  const setNotification = useStore((state) => state.setNotification);
  const router = useRouter();

  return (id: NotificationId, options?: IRedirectWithNotificationProps) => {
    setNotification(id);
    return router.push({
      pathname: options?.path ?? '/',
      query: { notify: id },
    });
  };
};
