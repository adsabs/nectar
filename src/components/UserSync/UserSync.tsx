import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { isNilOrEmpty, notEqual } from 'ramda-adjunct';
import { ReactElement, useEffect } from 'react';
import { useStoreApi } from '@/store';
import { useUser } from '@/lib/useUser';
import { logger } from '@/logger';
import api from '@/api/api';
import { userKeys } from '@/api/user/user';
import { IUserData } from '@/api/user/types';
import { isValidToken } from '@/auth-utils';
import { IApiUserResponse } from '@/pages/api/user';

export const UserSync = (): ReactElement => {
  const store = useStoreApi();
  const { user } = useUser();
  const qc = useQueryClient();

  const { data } = useQuery<IUserData | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get<IApiUserResponse>('/api/user');
      if (isNilOrEmpty(data)) {
        throw new Error('Empty session');
      }
      return isNilOrEmpty(data.user) ? null : data.user;
    },
    retry: false,
    refetchInterval: 60 * 5 * 1000,
  });

  useEffect(() => {
    if (user !== null && data && isValidToken(data) && notEqual(data, user)) {
      logger.debug({ msg: 'User Synced', username: data.username, anonymous: data.anonymous });

      store.setState({ user: data });

      api.setUserData(data);

      void qc.invalidateQueries(userKeys.getUserSettings());
    }
  }, [data, store, user, qc]);

  return <></>;
};
