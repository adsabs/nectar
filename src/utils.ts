import { IADSApiSearchParams, IDocsEntity, IUserData, SolrSort } from '@api';
import { fromThrowable } from 'neverthrow';
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { clamp, filter, last } from 'ramda';

type ParsedQueryParams = ParsedUrlQuery | qs.ParsedQs;

export const normalizeURLParams = (query: ParsedQueryParams): Record<string, string> => {
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
export const parseNumberAndClamp = (
  value: string | string[],
  min: number,
  max: number = Number.MAX_SAFE_INTEGER,
): number => {
  try {
    const page = parseInt(Array.isArray(value) ? value[0] : value, 10);
    return clamp(min, max, Number.isNaN(page) ? min : page);
  } catch (e) {
    return min;
  }
};

/**
 * Helper to parse query params into API search parameters
 */
export const parseQueryFromUrl = (params: ParsedQueryParams): IADSApiSearchParams & { p: number } => {
  const normalizedParams = normalizeURLParams(params);
  return {
    ...normalizedParams,
    q: normalizedParams?.q ?? '',
    sort: normalizeSolrSort(params.sort),
    p: parseNumberAndClamp(normalizedParams?.p, 1),
  };
};

// detects if passed in value is a valid SolrSort
export const isSolrSort = (maybeSolrSort: string): maybeSolrSort is SolrSort => {
  return [
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
  ].includes(maybeSolrSort);
};

// checks if passed in value is valid string
export const isString = (maybeString: unknown): maybeString is string => {
  return typeof maybeString === 'string';
};

/**
 * Takes raw value (maybe SolrSort) and returns valid SolrSort array
 */
export const normalizeSolrSort = (rawSolrSort: unknown): SolrSort[] => {
  // boil raw value down to string[]
  const sort = Array.isArray(rawSolrSort)
    ? filter(isString, rawSolrSort)
    : isString(rawSolrSort)
    ? rawSolrSort.split(',')
    : null;

  // if that fails, shortcut here with a default value
  if (sort === null) {
    return ['date desc'];
  }

  // filter out non-SolrSort values
  const validSort = filter(isSolrSort, sort);

  // append 'date desc' onto sort list, if not there already
  if ('date desc' === last(validSort)) {
    return validSort;
  }
  return validSort.concat('date desc');
};
