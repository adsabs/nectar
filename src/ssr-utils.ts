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
import { parseAPIError } from '@/utils/common/parseAPIError';
import { isUserData } from '@/auth-utils';
import { readPrefsCookie } from '@/utils/common/prefs-cookie';
import { SearchMode } from '@/utils/common/searchMode';

const log = logger.child({}, { msgPrefix: '[ssr-inject] ' });

const VALID_APP_MODES = new Set(Object.values(AppMode));
const VALID_SEARCH_MODES = new Set(Object.values(SearchMode));

export const updateUserStateSSR: IncomingGSSP = async (ctx, prevResult) => {
  const userData = ctx.req.session.token;
  const incomingState = (prevResult?.props?.dehydratedAppState ?? {}) as AppState;

  const url = new URL(ctx.resolvedUrl, 'http://localhost');
  const pathname = url.pathname;

  // forceMode query param — highest precedence (discipline routes)
  const forceMode = mapDisciplineParamToAppMode(ctx.query?.forceMode);

  // URL discipline param (d) only applies on /search
  const urlMode = pathname === '/search' ? mapDisciplineParamToAppMode(ctx.query?.d) : null;

  // Prefs cookie — persisted user preference (written by middleware on first ADS visit)
  const prefs = readPrefsCookie(ctx.req.headers.cookie);
  const cookieMode = prefs.mode && VALID_APP_MODES.has(prefs.mode as AppMode) ? (prefs.mode as AppMode) : undefined;
  // Priority: URL forceMode > URL d param > prefs cookie
  const resolvedMode = forceMode ?? urlMode ?? cookieMode;

  // ADS_COMPAT is only meaningful in the ASTROPHYSICS discipline context.
  // If the resolved mode is anything else, suppress the cookie search mode so
  // the ADS filters are not applied on non-astrophysics pages.
  const cookieSearchMode =
    prefs.searchMode && VALID_SEARCH_MODES.has(prefs.searchMode as SearchMode) && resolvedMode === AppMode.ASTROPHYSICS
      ? prefs.searchMode
      : undefined;

  log.debug({
    msg: 'Injecting session data into client props',
    userData,
    isValidUserData: isUserData(userData),
    resolvedMode,
    cookieMode,
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
        user: isUserData(userData) ? userData : {},
        notification: getNotification(ctx.query?.notify as NotificationId),
        ...(resolvedMode && { mode: resolvedMode }),
        ...(cookieSearchMode && { searchMode: cookieSearchMode }),
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

export const composeNextGSSP = (...fns: IncomingGSSP[]) =>
  withIronSessionSsr(
    async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
      ctx.res.setHeader('Cache-Control', 's-max-age=60, stale-while-revalidate=300');
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
