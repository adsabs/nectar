import { useRouter } from 'next/router';
import { NotificationId } from '@/store/slices';
import { useStore } from '@/store';

export const useReloadWithNotification = () => {
  const setNotification = useStore((state) => state.setNotification);
  const router = useRouter();

  return async (id: NotificationId) => {
    setNotification(id);
    try {
      return await router.replace({
        ...router,
        query: {
          ...router.query,
          notify: id,
        },
      });
    } catch {
      // If the router fails to replace, reload the page
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };
};
