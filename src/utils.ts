import { IUserData } from '@api';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
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
  req: GetServerSidePropsContext['req'] & { session: { userData: IUserData } };
  parsedQuery: ParsedUrlQuery;
  userData: IUserData;
};
