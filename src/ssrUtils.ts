import { isUserData } from '@api';
import { AppSerializableState, getSerializableDefaultStore } from '@store';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionConfig } from '@config';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import api from '@api/api';
import { mergeDeepLeft, pathOr } from 'ramda';

const updateUserStateSSR: IncomingGSSP = (ctx, prevResult) => {
  const userData = ctx.req.session.token;
  console.log('default', getSerializableDefaultStore(), prevResult);
  return Promise.resolve({
    props: {
      dehydratedAppState: {
        ...mergeDeepLeft(pathOr({}, ['props', 'dehydratedAppState'], prevResult), getSerializableDefaultStore()),
        user: isUserData(userData) ? userData : {},
      } as AppSerializableState,
    },
  });
};

export const injectSessionGSSP = withIronSessionSsr((ctx) => updateUserStateSSR(ctx, { props: {} }), sessionConfig);

type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: {
    props: { dehydratedAppState?: Partial<AppSerializableState> } & Record<string, unknown>;
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
    },
    sessionConfig,
  );
