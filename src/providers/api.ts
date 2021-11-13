import Adsapi from '@api';
import { IServiceConfig } from '@api/lib/service';
import { createContext, createElement, PropsWithChildren, ReactElement, useEffect, useRef } from 'react';

export type APIContext = { api: Adsapi };
export const apiCtx = createContext<APIContext | null>(null);

export const ApiProvider = (
  props: PropsWithChildren<{ config?: IServiceConfig; overrideInstance?: Adsapi }>,
): ReactElement => {
  const { config, overrideInstance } = props;

  // load the ref with the API instance
  const apiInstance = useRef<Adsapi>(new Adsapi(config));

  useEffect(() => {
    // reload instance on config change
    if (typeof config !== 'undefined') {
      apiInstance.current = new Adsapi(config);
    }
  }, [config]);

  return createElement(apiCtx.Provider, {
    value: { api: overrideInstance instanceof Adsapi ? overrideInstance : apiInstance.current },
    ...props,
  });
};
