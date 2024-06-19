import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { logger } from '@/logger';
import { AppState } from '@/store';
import { parseAPIError } from '@/utils';

type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: { props: { dehydratedAppState?: AppState } & Record<string, unknown>; [key: string]: unknown },
) => Promise<GetServerSidePropsResult<Record<string, unknown>>>;

export const injectSessionGSSP = () => ({ props: {} });

/**
 * Composes multiple GetServerSideProps functions
 * invoking left to right
 * Props are merged, other properties will overwrite
 */
export const composeNextGSSP =
  (...fns: IncomingGSSP[]) =>
  async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
    ctx.res.setHeader('Cache-Control', 'max-age=3600, stale-while-revaluate=86400');
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
        const resultProps = await result.props;
        props = { ...props, ...ssrProps.props, ...resultProps };
      }
      ssrProps = { ...ssrProps, ...result, props };
    }
    return ssrProps;
  };
