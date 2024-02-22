import { isUserData } from '@api';
import { AppState } from '@store';
import { getIronSession } from 'iron-session';
import { sessionConfig } from '@config';
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import api from '@api/api';
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query';
import { getNotification, NotificationId } from '@store/slices';
import { logger } from '@logger';
import { SessionData } from '@types';

const log = logger.child({ module: 'ssr-inject' });

const updateUserStateSSR: IncomingGSSP = async (ctx, prevResult) => {
  const session = await getIronSession<SessionData>(ctx.req, ctx.res, sessionConfig);
  log.debug({
    msg: 'Injecting session data into SSR',
    isValidUserData: isUserData(session.token),
    token: isUserData(session.token) ? session.token.access_token : null,
  });

  const qc = new QueryClient();
  // found an incoming dehydrated state, hydrate it
  if (prevResult?.props?.dehydratedState) {
    hydrate(qc, prevResult.props.dehydratedState);
  }
  qc.setQueryData(['user'], session.token);

  return Promise.resolve({
    props: {
      dehydratedAppState: {
        ...((prevResult?.props?.dehydratedAppState ?? {}) as AppState),
        user: isUserData(session.token) ? session.token : {},
        // set notification if present
        notification: getNotification(ctx.query?.notify as NotificationId),
      } as AppState,
      dehydratedState: dehydrate(qc),
    },
  });
};

export const injectSessionGSSP: GetServerSideProps = (ctx) => updateUserStateSSR(ctx, { props: {} });

type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: { props: { dehydratedAppState?: AppState } & Record<string, unknown>; [key: string]: unknown },
) => Promise<GetServerSidePropsResult<Record<string, unknown>>>;

/**
 * Composes multiple GetServerSideProps functions
 * invoking left to right
 * Props are merged, other properties will overwrite
 */
export const composeNextGSSP =
  (...fns: IncomingGSSP[]) =>
  async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
    const session = await getIronSession<SessionData>(ctx.req, ctx.res, sessionConfig);
    fns.push(updateUserStateSSR);
    api.setUserData(session.token);
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
  };
