import api from '@/api/api';
import axios from 'axios';
import { useEffect } from 'react';
import { useUser } from '@/lib/useUser';
import { useMutation } from '@tanstack/react-query';
import { ILogoutResponse } from '@/pages/api/auth/logout';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/auth-utils';
import { NotificationId } from '@/store/slices';

/**
 * Provides access to the user session and methods to logout
 */
export const useSession = () => {
  const { user, reset } = useUser();
  const { reload } = useRouter();

  const { mutate: logout, ...result } = useMutation(['logout'], async () => {
    const { data } = await axios.post<ILogoutResponse>('/api/auth/logout');
    return data;
  });

  useEffect(() => {
    if (result.data?.success) {
      api.reset();
      reset().finally(() => {
        // The URL can still carry notify=account-login-success from the login
        // redirect, which replays on reload.
        const url = new URL(window.location.href);
        url.searchParams.set('notify', 'account-logout-success' satisfies NotificationId);
        window.location.assign(`${url.pathname}${url.search}${url.hash}`);
      });
    }
  }, [result.data?.success]);

  useEffect(() => {
    if (result.isError) {
      reload();
    }
  }, [result.isError]);

  return {
    logout,
    isAuthenticated: isAuthenticated(user),
    ...result,
  };
};
