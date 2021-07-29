import Adsapi from '@api';
import { AppEvent, useAppCtx } from '@store';
import { isPast, parseISO } from 'date-fns';
import { useEffect, useRef } from 'react';

const isExpired = (maybeExpired: string) => isPast(parseISO(maybeExpired));

export const useADSApi = (): { adsapi: Adsapi } => {
  const { state, dispatch } = useAppCtx();
  const adsApiInstance = useRef<Adsapi>(null);

  useEffect(() => {
    // drop out early if already instantiated
    if (adsApiInstance.current instanceof Adsapi) {
      return;
    }

    // get a new token from the ADS api
    const bootstrap = async () => {
      const bootstrapResult = await Adsapi.bootstrap();
      bootstrapResult.map((user) => {
        dispatch({ type: AppEvent.SET_USER, payload: user });
        adsApiInstance.current = new Adsapi({ token: user.access_token });
      });
    };

    // check if we found a user or if the token is expired
    if (typeof state.user === 'undefined' || isExpired(state.user.expire_in)) {
      void bootstrap();
    } else {
      adsApiInstance.current = new Adsapi({ token: state.user.access_token });
    }
  }, [state.user]);

  return { adsapi: adsApiInstance.current };
};
