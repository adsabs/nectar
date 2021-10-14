import AdsApi, { IADSApiSearchParams, IDocsEntity, IUserData } from '@api';
import { MetricsResponseKey, CitationsStatsKey, BasicStatsKey } from '@api/lib/metrics/types';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
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

export const isBrowser = (): boolean => typeof window !== 'undefined';

export interface IOriginalDoc {
  error?: string;
  notFound?: boolean;
  doc?: IDocsEntity;
}

export const getDocument = async (api: AdsApi, id: string): Promise<IOriginalDoc> => {
  const result = await api.search.query({
    q: `identifier:${id}`,
    fl: [...abstractPageNavDefaultQueryFields, 'title', 'bibcode'],
  });

  return result.isErr()
    ? { error: 'Unable to get document' }
    : result.value.numFound === 0
    ? { notFound: true }
    : { doc: result.value.docs[0] };
};

export const getHasGraphics = async (api: AdsApi, bibcode: string): Promise<boolean> => {
  const result = await api.graphics.query({
    bibcode: bibcode,
  });
  return result.isErr() ? false : true;
};

export const getHasMetrics = async (api: AdsApi, bibcode: string): Promise<boolean> => {
  const result = await api.metrics.query({
    bibcode: bibcode,
  });

  if (result.isErr()) {
    return false;
  }

  const metrics = result.value;
  const hasCitations =
    metrics && metrics[MetricsResponseKey.CITATION_STATS][CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS] > 0;
  const hasReads = metrics && metrics[MetricsResponseKey.BASIC_STATS][BasicStatsKey.TOTAL_NUMBER_OF_READS] > 0;

  return hasCitations || hasReads;
};
