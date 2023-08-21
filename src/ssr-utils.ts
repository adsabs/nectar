import { isUserData } from '@api';
import { AppState } from '@store';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionConfig } from '@config';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import api from '@api/api';
import { dehydrate, DehydratedState, QueryClient } from '@tanstack/react-query';
import { getNotification, NotificationId } from '@store/slices';

const updateUserStateSSR: IncomingGSSP = (ctx, prevResult) => {
  const userData = ctx.req.session.token;

  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed('SSR');
    console.log('session', ctx.req.session);
    console.log('user', userData);
    console.groupEnd();
  }

  const qc = new QueryClient();
  qc.setQueryData(['user'], userData);

  return Promise.resolve({
    props: {
      dehydratedAppState: {
        ...((prevResult?.props?.dehydratedAppState ?? {}) as AppState),
        user: isUserData(userData) ? userData : {},
        // set notification if present
        notification: getNotification(ctx.query?.notify as NotificationId),
      } as AppState,
      dehydratedState: {
        ...((prevResult?.props?.dehydratedState ?? {}) as DehydratedState),
        ...dehydrate(qc),
      } as DehydratedState,
    },
  });
};

export const injectSessionGSSP = withIronSessionSsr((ctx) => updateUserStateSSR(ctx, { props: {} }), sessionConfig);

type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: { props: { dehydratedAppState?: AppState } & Record<string, unknown>; [key: string]: unknown },
) => Promise<GetServerSidePropsResult<Record<string, unknown>>>;

/**
 * Composes multiple GetServerSideProps functions
 * invoking left to right
 * Props are merged, other properties will overwrite
 */
export const composeNextGSSP = (...fns: IncomingGSSP[]) =>
  withIronSessionSsr(async (ctx: GetServerSidePropsContext): Promise<
    GetServerSidePropsResult<Record<string, unknown>>
  > => {
    fns.push(updateUserStateSSR);
    api.setUserData(ctx.req.session.token);
    let ssrProps = { props: {} };
    for (const fn of fns) {
      const result = await fn(ctx, ssrProps);
      let props = {};
      if ('props' in result) {
        props = { ...ssrProps.props, ...result.props };
      }
      ssrProps = { ...ssrProps, ...result, props };
    }
    return ssrProps;
  }, sessionConfig);
