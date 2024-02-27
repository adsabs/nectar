import { isUserData } from '@api';
import { AppState } from '@store';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionConfig } from '@config';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import api from '@api/api';
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query';
import { getNotification, NotificationId } from '@store/slices';
import { logger } from '../logger/logger';

const log = logger.child({ module: 'ssr-inject' });

const injectColorModeCookie: IncomingGSSP = (ctx, prev) => {
  const colorMode = ctx.req.cookies['chakra-ui-color-mode'];
  log.debug({ msg: 'Injecting color mode from cookie', colorMode });
  return Promise.resolve({ props: { colorModeCookie: `chakra-ui-color-mode=${colorMode}`, ...prev.props } });
};

const updateUserStateSSR: IncomingGSSP = (ctx, prevResult) => {
  const userData = ctx.req.session.token;

  log.debug({
    msg: 'Injecting session data into SSR',
    session: ctx.req.session,
    isValidUserData: isUserData(userData),
    token: isUserData(userData) ? userData.access_token : null,
  });

  const qc = new QueryClient();
  // found an incoming dehydrated state, hydrate it
  if (prevResult?.props?.dehydratedState) {
    hydrate(qc, prevResult.props.dehydratedState);
  }
  qc.setQueryData(['user'], userData);

  return Promise.resolve({
    props: {
      dehydratedAppState: {
        ...((prevResult?.props?.dehydratedAppState ?? {}) as AppState),
        user: isUserData(userData) ? userData : {},
        // set notification if present
        notification: getNotification(ctx.query?.notify as NotificationId),
      } as AppState,
      dehydratedState: dehydrate(qc),
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
    fns.push(injectColorModeCookie);
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
