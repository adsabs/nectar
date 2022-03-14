import { IADSApiSearchParams, IDocsEntity, IUserData, SolrSort } from '@api';
import { fromThrowable } from 'neverthrow';
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { clamp, equals, filter, last } from 'ramda';

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

export const getFomattedNumericPubdate = (pubdate: string): string | null => {
  const regex = /^(?<year>\d{4})-(?<month>\d{2})/;
  const match = regex.exec(pubdate);
  if (match === null) {
    return null;
  }
  const { year, month } = match.groups;
  return `${year}/${month}`;
};

export const safeParse = <T>(value: string, defaultValue: T): T => {
  try {
    if (typeof value !== 'string') {
      return defaultValue;
    }

    return JSON.parse(value) as T;
  } catch (e) {
    return defaultValue;
  }
};

export const useBaseRouterPath = (): { basePath: string } => {
  const { asPath } = useRouter();
  return { basePath: fromThrowable<() => string, Error>(() => asPath.split('?')[0])().unwrapOr('/') };
};

export const truncateDecimal = (num: number, d: number): number => {
  const regex = new RegExp(`^-?\\d+(\\.\\d{0,${d}})?`);
  return parseFloat(regex.exec(num.toString())[0]);
};

type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: { props: Record<string, unknown>; [key: string]: unknown },
) => Promise<GetServerSidePropsResult<Record<string, unknown>>>;

export const composeNextGSSP =
  (...fns: IncomingGSSP[]) =>
  async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
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
  };

export const noop = (): void => {
  // do nothing
};

/**
 * Helper utility for parsing int from string/string[]
 * It will also clamp the resulting number between min/max
 */
export const parseNumberAndClamp = (value: string | string[], min: number, max: number = Number.MAX_SAFE_INTEGER) => {
  try {
    const page = parseInt(Array.isArray(value) ? value[0] : value, 10);
    return clamp(min, max, Number.isNaN(page) ? min : page);
  } catch (e) {
    return min;
  }
};

export const parseQueryFromUrl = (params: ParsedUrlQuery): IADSApiSearchParams & { p: number } => {
  const normalizedParams = normalizeURLParams(params);
  return {
    q: normalizedParams?.q ?? '',
    sort: normalizeSolrSort(params.sort),
    p: parseNumberAndClamp(normalizedParams?.p, 1),
    ...normalizedParams,
  };
};

const sortOptions = [
  'author_count asc',
  'author_count desc',
  'bibcode asc',
  'bibcode desc',
  'citation_count asc',
  'citation_count desc',
  'citation_count_norm asc',
  'citation_count_norm desc',
  'classic_factor asc',
  'classic_factor desc',
  'first_author asc',
  'first_author desc',
  'date asc',
  'date desc',
  'entry_date asc',
  'entry_date desc',
  'read_count asc',
  'read_count desc',
  'score asc',
  'score desc',
];
export const isSolrSort = (maybeSolrSort: string): maybeSolrSort is SolrSort => {
  return sortOptions.includes(maybeSolrSort);
};

export const isString = (maybeString: unknown): maybeString is string => {
  return typeof maybeString === 'string';
};

export const normalizeSolrSort = (rawSolrSort: unknown): SolrSort[] => {
  const sort =
    Array.isArray(rawSolrSort) && rawSolrSort.length > 0
      ? rawSolrSort.filter(isString)
      : isString(rawSolrSort)
      ? [rawSolrSort]
      : null;

  if (sort === null) {
    // default sort value
    return ['date desc'];
  }

  const filtered = filter(isSolrSort, sort);

  if (equals(last(filtered), 'date desc')) {
    return filtered;
  }
  return filtered.concat('date desc');
};
