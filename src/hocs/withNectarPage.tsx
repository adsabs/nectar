import { IADSApiBootstrapData } from '@api';
import { AppEvent, useAppCtx } from '@store';
import { NextPage } from 'next';
import { PropsWithChildren, useEffect } from 'react';

export interface INectarPageProps {
  sessionData: IADSApiBootstrapData;
}

export const withNectarPage = <P extends INectarPageProps>(
  Page: NextPage<Omit<PropsWithChildren<P>, 'sessionData'>>,
): NextPage<P> => {
  return ({ sessionData, ...props }) => {
    const { dispatch } = useAppCtx();

    useEffect(() => {
      // push the session data from the server up to the root state
      if (typeof sessionData !== 'undefined') {
        dispatch({ type: AppEvent.SET_USER, payload: sessionData });
      }
    }, [sessionData]);

    return <Page {...props} />;
  };
};
