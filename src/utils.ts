import AdsApi, { IDocsEntity, IUserData } from '@api';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fromThrowable } from 'neverthrow';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';

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

export const initMiddleware =
  (middleware: (req: NextApiRequest, res: NextApiResponse, cb: (result: unknown) => void) => unknown) =>
  (req: NextApiRequest, res: NextApiResponse): Promise<unknown> =>
    new Promise((resolve, reject) =>
      middleware(req, res, (result) => (result instanceof Error ? reject(result) : resolve(result))),
    );

export type ADSServerSideContext = GetServerSidePropsContext & {
  req: GetServerSidePropsContext['req'] & { session: { userData: IUserData } };
  parsedQuery: ParsedUrlQuery;
  userData: IUserData;
};

export const isBrowser = (): boolean => typeof window !== 'undefined';

export interface IOriginalDoc {
  error?: string;
  notFound?: boolean;
  doc?: IDocsEntity;
  numFound?: number;
}

export const getDocument = async (api: AdsApi, id: string): Promise<IOriginalDoc> => {
  const result = await api.search.query({
    q: `identifier:${id}`,
    fl: [...abstractPageNavDefaultQueryFields, 'title'],
  });

  return result.isErr()
    ? { error: 'Unable to get document' }
    : result.value.numFound === 0
    ? { notFound: true }
    : { doc: result.value.docs[0], numFound: result.value.numFound };
};

export const getFomattedNumericPubdate = (pubdate: string): string | null => {
  const regex = /^(?<year>\d{4})-(?<month>\d{2})/;
  const match = regex.exec(pubdate);
  if (match === null) {
    return null;
  }
  const { year, month } = match.groups;
  return `${year}/${month}`;
};

export const useBaseRouterPath = (): { basePath: string } => {
  const { asPath } = useRouter();
  return { basePath: fromThrowable<() => string, Error>(() => asPath.split('?')[0])().unwrapOr('/') };
};
