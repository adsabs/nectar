import { IADSApiBootstrapData } from '@api';
import { INectarPageProps } from '@hocs/withNectarPage';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { ParsedUrlQuery } from 'node:querystring';

export const normalizeURLParams = (query: ParsedUrlQuery): Record<string, string> => {
  return Object.keys(query).reduce((acc, key) => {
    const rawValue = query[key];
    const value = typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue.join(',') : undefined;

    if (typeof value === 'undefined') {
      return acc;
    }

    return {
      ...acc,
      [key]: value,
    };
  }, {});
};

export const initMiddleware = (
  middleware: (req: NextApiRequest, res: NextApiResponse, cb: (result: unknown) => void) => unknown,
) => (req: NextApiRequest, res: NextApiResponse): Promise<unknown> =>
  new Promise((resolve, reject) =>
    middleware(req, res, (result) => (result instanceof Error ? reject(result) : resolve(result))),
  );

export type ADSServerSideContext = GetServerSidePropsContext & {
  req: GetServerSidePropsContext['req'] & { session: { userData: IADSApiBootstrapData } };
  parsedQuery: ParsedUrlQuery;
  userData: IADSApiBootstrapData;
};

export const withNectarSessionData = <P extends INectarPageProps, Q extends ParsedUrlQuery = ParsedUrlQuery>(
  fn: (ctx: GetServerSidePropsContext<Q>, userData: IADSApiBootstrapData) => Promise<GetServerSidePropsResult<P>>,
): GetServerSideProps<P, Q> => {
  return async (ctx) => {
    const request = ctx.req as typeof ctx.req & {
      session: { userData: IADSApiBootstrapData };
    };
    const sessionData = request.session.userData;

    return await fn(ctx, sessionData);
  };
};
