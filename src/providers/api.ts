import Adsapi from '@api';
import { IServiceConfig } from '@api/lib/service';
import { useAppCtx } from '@store';
import { createContext, createElement, PropsWithChildren, ReactElement, useEffect, useRef } from 'react';

export type APIContext = { api: Adsapi };
export const apiCtx = createContext<APIContext | null>(null);

export const ApiProvider = (
  props: PropsWithChildren<{ config?: IServiceConfig; overrideInstance?: Adsapi }>,
): ReactElement => {
  const { config, overrideInstance } = props;
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
  return createElement(apiCtx.Provider, {
    value: { api: overrideInstance instanceof Adsapi ? overrideInstance : apiInstance.current },
    ...props,
  });
};
