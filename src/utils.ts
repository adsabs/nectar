import api, { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity, IUserData, SolrSort } from '@api';
import { APP_DEFAULTS } from '@config';
import { NumPerPageType, SafeSearchUrlParams } from '@types';
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';
import qs from 'qs';
import { ParsedUrlQuery } from 'querystring';
import { clamp, filter, last, omit, propIs, uniq } from 'ramda';

type ParsedQueryParams = ParsedUrlQuery | qs.ParsedQs;

/**
 * Takes in raw URL parameters and converts values into strings, returns an object
 */
export const normalizeURLParams = <T extends Record<string, string> = Record<string, string>>(
  query: ParsedQueryParams,
): T => {
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
  }, {}) as T;
};

export const isBrowser = (): boolean => typeof window !== 'undefined';

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
export interface IOriginalDoc {
  error?: string;
  notFound?: boolean;
  doc?: IDocsEntity;
  numFound?: number;
}

// todo: should be moved to somewhere more specific
export const getFomattedNumericPubdate = (pubdate: string): string | null => {
  const regex = /^(?<year>\d{4})-(?<month>\d{2})/;
  const match = regex.exec(pubdate);
  if (match === null) {
    return null;
  }
  const { year, month } = match.groups;
  return `${year}/${month}`;
};

/**
 * Parse a JSON string
 * Returns a default value on failure
 */
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

/**
 * Simple hook for parsing
 */
export const useBaseRouterPath = (): { basePath: string } => {
  const { asPath } = useRouter();
  try {
    return { basePath: asPath.split('?')[0] };
  } catch (e) {
    return { basePath: '/' };
  }
};

/**
 * Truncate number to a certain precision
 */
export const truncateDecimal = (num: number, d: number): number => {
  const regex = new RegExp(`^-?\\d+(\\.\\d{0,${d}})?`);
  return parseFloat(regex.exec(num.toString())[0]);
};

type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  props: { props: Record<string, unknown>; [key: string]: unknown },
) => Promise<GetServerSidePropsResult<Record<string, unknown>>>;

/**
 * Composes multiple GetServerSideProps functions
 * invoking left to right
 * Props are merged, other properties will overwrite
 */
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const noop = (..._args: unknown[]): void => {
  // do nothing
};

/**
 * Helper utility for clamping the resulting number between min/max
 */
export const parseNumberAndClamp = (
  value: string | number | (number | string)[],
  min: number,
  max: number = Number.MAX_SAFE_INTEGER,
): number => {
  try {
    const val = Array.isArray(value) ? value[0] : value;
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    return clamp(min, max, Number.isNaN(num) ? min : num);
  } catch (e) {
    return min;
  }
};

export const isNumPerPageType = (value: number): value is NumPerPageType => {
  return APP_DEFAULTS.PER_PAGE_OPTIONS.includes(value as NumPerPageType);
};

/**
 * Helper to parse query params into API search parameters
 */
export const parseQueryFromUrl = <TExtra extends Record<string, string>>(
  params: ParsedQueryParams,
  { sortPostfix }: { sortPostfix?: SolrSort } = {},
) => {
  const normalizedParams = normalizeURLParams(params);
  const n = parseNumberAndClamp(normalizedParams?.n, APP_DEFAULTS.PER_PAGE_OPTIONS[0]);
  return {
    ...normalizedParams,
    q: normalizedParams?.q ?? '',
    sort: normalizeSolrSort(params.sort, sortPostfix),
    p: parseNumberAndClamp(normalizedParams?.p, 1),
  } as IADSApiSearchParams & { p?: number; n?: number } & TExtra;
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
    'id asc',
    'id desc',
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
export const normalizeSolrSort = (rawSolrSort: unknown, postfixSort?: SolrSort): SolrSort[] => {
  // boil raw value down to string[]
  const sort = Array.isArray(rawSolrSort)
    ? filter(isString, rawSolrSort)
    : isString(rawSolrSort)
    ? rawSolrSort.split(',')
    : null;

  const tieBreaker = postfixSort || APP_DEFAULTS.QUERY_SORT_POSTFIX;

  // if that fails, shortcut here with a default value
  if (sort === null) {
    return ['date desc', tieBreaker];
  }

  // filter out non-SolrSort values
  const validSort = uniq(filter(isSolrSort, sort));

  // append tieBreaker onto sort list, if not there already
  if (tieBreaker === last(validSort)) {
    return validSort;
  }

  // if all values are filtered out, return the default
  if (validSort.length === 0) {
    return ['date desc', tieBreaker];
  }

  return validSort.concat(tieBreaker);
};

// returns true if value passed in is a valid IADSApiSearchResponse
export const isApiSearchResponse = (value: unknown): value is IADSApiSearchResponse => {
  return (
    propIs(Object, 'responseHeader', value) &&
    (propIs(Object, 'response', value) || propIs(Object, 'error', value) || propIs(Object, 'stats', value))
  );
};

export const isIADSSearchParams = (value: unknown): value is IADSApiSearchParams => {
  return propIs(String, 'q', value);
};

/**
 * Enumerate enum keys
 *
 * @see https://www.petermorlion.com/iterating-a-typescript-enum/
 */
export const enumKeys = <O extends object, K extends keyof O = keyof O>(obj: O): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

/**
 * Server-side API setup
 * For now, this just mutates the api instance, setting the token from the session
 */
export const setupApiSSR = (ctx: GetServerSidePropsContext<ParsedUrlQuery>) => {
  api.setUserData(ctx.req.session.userData);
};

// omit params that should not be included in any urls
const omitSearchParams = omit(['fl', 'start', 'rows', 'id']);

export const makeSearchParams = (params: SafeSearchUrlParams, options: { omit?: string[] } = {}) => {
  const cleanParams = omitSearchParams(params);
  return stringifySearchParams(
    omit(options.omit ?? [], {
      ...cleanParams,
      sort: normalizeSolrSort(cleanParams.sort),
      p: parseNumberAndClamp(cleanParams?.p, 1),
    }),
  );
};

export const stringifySearchParams = (params: Record<string, unknown>) =>
  qs.stringify(params, {
    indices: false,
    arrayFormat: 'comma',
    format: 'RFC1738',
    sort: (a, b) => a - b,
    skipNulls: true,
  });
