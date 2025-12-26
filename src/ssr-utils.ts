import { AppState } from '@/store';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionConfig } from '@/config';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import api from '@/api/api';
import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query';
import { getNotification, NotificationId } from '@/store/slices';
import { logger } from '@/logger';
import { AppMode } from '@/types';
import { mapDisciplineParamToAppMode } from '@/utils/appMode';
import { isFromLegacyApp } from '@/utils/legacyAppDetection';

import { parseAPIError } from '@/utils/common/parseAPIError';
import { isUserData } from '@/auth-utils';

const log = logger.child({}, { msgPrefix: '[ssr-inject] ' });

export const updateUserStateSSR: IncomingGSSP = async (ctx, prevResult) => {
  const userData = ctx.req.session.token;
  const incomingState = (prevResult?.props?.dehydratedAppState ?? {}) as AppState;

  // Check referer header directly to detect legacy ADS app referrers
  const referer = ctx.req.headers.referer;
  const isLegacyReferrer = isFromLegacyApp(referer);

  // Only apply legacy mode if there's no persisted state for adsMode
  const applyLegacyMode = isLegacyReferrer && incomingState.adsMode === undefined;

  const pathname = new URL(ctx.resolvedUrl, 'http://localhost').pathname;
  const urlMode = pathname === '/search' ? mapDisciplineParamToAppMode(ctx.query?.d) : null;
  const legacyMode = applyLegacyMode ? AppMode.ASTROPHYSICS : undefined;
  const resolvedMode = urlMode ?? legacyMode;
  const legacyAdsMode = applyLegacyMode ? { adsMode: { active: true } } : {};

  log.debug({
    msg: 'Injecting session data into client props',
    userData,
    isValidUserData: isUserData(userData),
    token: isUserData(userData) ? userData.access_token : null,
    referer,
    isLegacyReferrer,
    applyLegacyMode,
    resolvedMode,
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
        ...incomingState,
        user: isUserData(userData) ? userData : {},
        // set notification if present
        notification: getNotification(ctx.query?.notify as NotificationId),
        // discipline via URL param (d) applies only on /search, otherwise keep legacy app mode
        ...(resolvedMode && { mode: resolvedMode }),
        ...legacyAdsMode,
      } as AppState,
      dehydratedState: dehydrate(qc),
    },
  });
};

export const injectSessionGSSP = withIronSessionSsr((ctx) => updateUserStateSSR(ctx, { props: {} }), sessionConfig);

type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: {
    props: { dehydratedAppState?: AppState } & Record<string, unknown>;
    [key: string]: unknown;
  },
) => Promise<GetServerSidePropsResult<Record<string, unknown>>>;

/**
 * Composes multiple GetServerSideProps functions
 * invoking left to right
 * Props are merged, other properties will overwrite
 */
export const composeNextGSSP = (...fns: IncomingGSSP[]) =>
  withIronSessionSsr(
    async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
      ctx.res.setHeader('Cache-Control', 's-max-age=60, stale-while-revalidate=300');

      // only push if the list of fns does not already have the updater
      if (!fns.includes(updateUserStateSSR)) {
        fns.push(updateUserStateSSR);
      }

      api.setUserData(ctx.req.session.token);
      let ssrProps = { props: {} };

      for (const fn of fns) {
        let result;
        let props = {};
        try {
          // Ensure that the result is awaited properly and no promises remain unhandled
          result = await fn(ctx, ssrProps); // Await the function result
        } catch (error) {
          logger.error({ error });
          props = { pageError: parseAPIError(error) };
        }

        // Make sure the result is fully resolved and it's not a Promise
        if (result && 'props' in result) {
          // Check if result.props is a promise and await it if necessary
          if (result.props instanceof Promise) {
            result.props = await result.props;
          }
          props = { ...props, ...ssrProps.props, ...result.props }; // Spread properties safely
        }

        ssrProps = { ...ssrProps, ...result, props };
      }
      return ssrProps;
    },
    sessionConfig,
  );
