import Adsapi from '@api';
import { IServiceConfig } from '@api/lib/service';
import { useAppCtx } from '@store';
import { useEffect, useRef } from 'react';

export const useAPI = (config?: IServiceConfig) => {
  const {
    state: {
      user: { access_token: token },
    },
  } = useAppCtx();
  const apiInstance = useRef<Adsapi>(new Adsapi({ ...config, token }));

  useEffect(() => {
    if (token.length > 0) {
      apiInstance.current = new Adsapi({ ...config, token });
    }
  }, [token, config]);

  return { api: apiInstance.current };
};
