import { isUserData } from '@api';
import { AppState } from '@store';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionConfig } from '@config';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import api from '@api/api';
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query';
import { getNotification, NotificationId } from '@store/slices';
import { logger } from '../logger/logger';
import { parseAPIError } from '@utils';

const log = logger.child({}, { msgPrefix: '[ssr-inject] ' });

const injectNonce: IncomingGSSP = (ctx, prev) => {
  const nonce = ctx.res.getHeader('X-Nonce') ?? '';
  log.debug({ msg: 'Injecting nonce', nonce });
  return Promise.resolve({ props: { nonce, ...prev.props } });
};

const updateUserStateSSR: IncomingGSSP = (ctx, prevResult) => {
  const userData = ctx.req.session.token;

  log.debug({
    msg: 'Injecting session data into client props',
    userData,
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
    ctx.res.setHeader('Cache-Control', 'max-age=3600, stale-while-revaluate=86400');
    fns.push(injectNonce);
    fns.push(updateUserStateSSR);
    api.setUserData(ctx.req.session.token);
    let ssrProps = { props: {} };
    for (const fn of fns) {
      let result;
      let props = {};
      try {
        result = await fn(ctx, ssrProps);
      } catch (error) {
        logger.error({ error });
        props = { pageError: parseAPIError(error) };
      }
      if (result && 'props' in result) {
        props = { ...props, ...ssrProps.props, ...result.props };
      }
      ssrProps = { ...ssrProps, ...result, props };
    }
    return ssrProps;
  }, sessionConfig);
