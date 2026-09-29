import api from '@/api/api';
import axios from 'axios';
import { useEffect } from 'react';
import { useUser } from '@/lib/useUser';
import { useMutation } from '@tanstack/react-query';
import { ILogoutResponse } from '@/pages/api/auth/logout';
import { isAuthenticated } from '@/auth-utils';
import { NotificationId } from '@/store/slices';

const reloadWithNotification = (id: NotificationId) => {
  const url = new URL(window.location.href);
  url.searchParams.set('notify', id);
  window.location.replace(`${url.pathname}${url.search}${url.hash}`);
};

/**
 * Provides access to the user session and methods to logout
 */
export const useSession = () => {
  const { user, reset } = useUser();

  const { mutate: logout, ...result } = useMutation(['logout'], async () => {
    const { data } = await axios.post<ILogoutResponse>('/api/auth/logout');
    return data;
  });

  useEffect(() => {
    if (result.data?.success) {
      api.reset();
      reset().finally(() => {
        reloadWithNotification('account-logout-success');
      });
    }
  }, [result.data?.success]);

  useEffect(() => {
    if (result.isError) {
      reloadWithNotification('account-logout-failed');
    }
  }, [result.isError]);

  return {
    logout,
    isAuthenticated: isAuthenticated(user),
    ...result,
  };
};
