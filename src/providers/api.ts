import Adsapi from '@api';
import { IServiceConfig } from '@api/lib/service';
import { useAppCtx } from '@store';
import * as React from 'react';

export type APIContext = { api: Adsapi };
export const apiCtx = React.createContext<APIContext | null>(null);

export const ApiProvider = (
  props: React.PropsWithChildren<{ config?: IServiceConfig; overrideInstance?: Adsapi }>,
): React.ReactElement => {
  const { config, overrideInstance } = props;
  const {
    state: {
      user: { access_token: token },
    },
  } = useAppCtx();
  const apiInstance = React.useRef<Adsapi>(new Adsapi({ ...config, token }));

  React.useEffect(() => {
    if (token.length > 0) {
      apiInstance.current = new Adsapi({ ...config, token });
    }
  }, [token, config]);
  return React.createElement(apiCtx.Provider, {
    value: { api: overrideInstance instanceof Adsapi ? overrideInstance : apiInstance.current },
    ...props,
  });
};
