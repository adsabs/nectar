import { AppState } from '@/store';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionConfig } from '@/config';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import api from '@/api/api';
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { isUserData } from '@/auth-utils';
import { resolveAppState } from '@/lib/resolveAppState';
import { getIsolationScope } from '@sentry/nextjs';
import { authTagForSession, SENTRY_AUTH_TAG_NAME } from '@/lib/sentryAuthTag';

const log = logger.child({}, { msgPrefix: '[ssr-inject] ' });

// Every SSR page funnels through here, so it is the one server-side choke
// point that sees the session on every render.
export const updateUserStateSSR: IncomingGSSP = async (ctx, prevResult) => {
  getIsolationScope().setTag(SENTRY_AUTH_TAG_NAME, authTagForSession(ctx.req.session.isAuthenticated));

  const userData = ctx.req.session.token;
  const incomingState = (prevResult?.props?.dehydratedAppState ?? {}) as AppState;

  const url = new URL(ctx.resolvedUrl, 'http://localhost');

  const resolved = resolveAppState({
    pathname: url.pathname,
    forceModeParam: ctx.query?.forceMode,
    dParam: ctx.query?.d,
    notifyParam: ctx.query?.notify,
    cookieHeader: ctx.req.headers.cookie,
    userData,
  });

  log.debug({
    msg: 'Injecting session data into client props',
    userData,
    isValidUserData: isUserData(userData),
    resolvedMode: resolved.mode,
  });

  const qc = new QueryClient();
  if (prevResult?.props?.dehydratedState) {
    hydrate(qc, prevResult.props.dehydratedState);
  }
  qc.setQueryData(['user'], userData);

  return Promise.resolve({
    props: {
      dehydratedAppState: {
        ...incomingState,
        ...resolved,
      } as AppState,
      dehydratedState: dehydrate(qc),
    },
  });
};

export const injectSessionGSSP = withIronSessionSsr((ctx) => updateUserStateSSR(ctx, { props: {} }), sessionConfig);

export type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: {
    props: { dehydratedAppState?: AppState } & Record<string, unknown>;
    [key: string]: unknown;
  },
) => Promise<GetServerSidePropsResult<Record<string, unknown>>>;

export const composeNextGSSP = (...fns: IncomingGSSP[]) =>
  withIronSessionSsr(
    async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
      // dehydratedState carries the session token, so never shared-cache this
      ctx.res.setHeader('Cache-Control', 'private, no-store');
      if (!fns.includes(updateUserStateSSR)) {
        fns.push(updateUserStateSSR);
      }
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
          if (result.props instanceof Promise) {
            result.props = await result.props;
          }
          props = { ...props, ...ssrProps.props, ...result.props };
        }
        ssrProps = { ...ssrProps, ...result, props };
      }
      return ssrProps;
    },
    sessionConfig,
  );
