'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IronSession } from 'iron-session';
import axios from 'axios';
import { isNilOrEmpty, notEqual } from 'ramda-adjunct';
import { ReactElement, useEffect } from 'react';

import api from '@/api/api';
import { userKeys } from '@/api/user/user';
import { isValidToken } from '@/auth-utils';
import { logger } from '@/logger';
import { useUser } from '@/lib/useUser';
import { useStoreApi } from '@/store';

export const UserSync = (): ReactElement => {
  const store = useStoreApi();
  const { user } = useUser();
  const qc = useQueryClient();

  const { data } = useQuery<{
    user: IronSession['token'];
    isAuthenticated: boolean;
  }>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get<{
        user: IronSession['token'];
        isAuthenticated: boolean;
      }>('/api/user', {
        headers: {
          'X-Refresh-Token': 1,
        },
      });
      if (isNilOrEmpty(data)) {
        throw new Error('Empty session');
      }
      return data;
    },
    retry: false,
    refetchInterval: 60 * 5 * 1000,
  });

  useEffect(() => {
    if (data?.user && isValidToken(data?.user) && notEqual(data.user, user)) {
      logger.debug({ msg: 'User Synced', user: data.user });

      store.setState({ user: data.user });
      api.setUserData(data.user);
      void qc.invalidateQueries(userKeys.getUserSettings());
    }
  }, [data, store, user, qc]);

  return <></>;
};
