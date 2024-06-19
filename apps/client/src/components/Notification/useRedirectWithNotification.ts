import { useRouter } from 'next/router';
import { NotificationId } from '@/store/slices';
import { useStore } from '@/store';

interface IRedirectWithNotificationProps {
  path: string;
  replace?: boolean;
}

export const useRedirectWithNotification = () => {
  const setNotification = useStore((state) => state.setNotification);
  const router = useRouter();

  return async (id: NotificationId, options?: IRedirectWithNotificationProps) => {
    setNotification(id);
    try {
      return await router[options?.replace ? 'replace' : 'push']({
        pathname: options?.path ?? '/',
        query: { notify: id },
      });
    } catch {
      // If the router fails to replace, reload the page
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };
};
