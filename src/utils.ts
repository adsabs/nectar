import api, { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity, isUserData, IUserData, SolrSort } from '@api';
import { APP_DEFAULTS } from '@config';
import { AppSerializableState, getSerializableDefaultStore } from '@store';
import { NumPerPageType, SafeSearchUrlParams } from '@types';
import axios, { AxiosError } from 'axios';
import DOMPurify from 'isomorphic-dompurify';
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';
import qs from 'qs';
import { ParsedUrlQuery } from 'querystring';
import {
  clamp,
  filter,
  find,
  head,
  is,
  keys,
  last,
  mergeDeepLeft,
  omit,
  pathOr,
  paths,
  pick,
  pipe,
  propIs,
  uniq,
  when,
} from 'ramda';
import { isArray, isNotString, isPlainObject } from 'ramda-adjunct';

type ParsedQueryParams = ParsedUrlQuery | qs.ParsedQs;

/**
 * Takes in raw URL parameters and converts values into strings, returns an object
 */
export const normalizeURLParams = <T extends Record<string, string> = Record<string, string>>(
  query: ParsedQueryParams,
  skipKeys: string[] = [],
): T => {
  return Object.keys(query).reduce((acc, key) => {
    if (skipKeys.includes(key)) {
      return acc;
    }
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

export const pickUserData = pick(['username', 'anonymous', 'access_token', 'expire_in']);
export const userGSSP = async (
  ctx: GetServerSidePropsContext,
  state: { props?: { dehydratedAppState?: Partial<AppSerializableState> } },
) => {
  const userData = pickUserData(ctx.req.session.userData);
  console.log('default', getSerializableDefaultStore(), state);
  return Promise.resolve({
    props: {
      dehydratedAppState: {
        ...mergeDeepLeft(pathOr({}, ['props', 'dehydratedAppState'], state), getSerializableDefaultStore()),
        user: isUserData(userData) ? userData : {},
      } as AppSerializableState,
    },
  });
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
export const parseQueryFromUrl = <TExtra extends Record<string, string | string[]>>(
  url: string,
  { sortPostfix }: { sortPostfix?: SolrSort } = {},
) => {
  const params = parseSearchParams(url.split('?')[1]) as Record<string, string | string[]>;
  const normalizedParams = normalizeURLParams(params, ['fq']);
  return {
    ...normalizedParams,
    q: normalizedParams?.q ?? '',
    sort: normalizeSolrSort(params.sort, sortPostfix),
    p: parseNumberAndClamp(normalizedParams?.p, 1),
    ...(params.fq ? { fq: safeSplitString(params.fq) } : {}),
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
export const isString = (maybeString: unknown): maybeString is string => typeof maybeString === 'string';

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
  return isPlainObject(value) && propIs(String, 'q', value);
};

export const safeSplitString = (value: string | string[], delimiter: string | RegExp = ','): string[] => {
  try {
    if (Array.isArray(value)) {
      return value;
    }

    if (isString(value)) {
      return value.split(delimiter);
    }
  } catch (e) {
    return [];
  }
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
// `id` is typically slug used in abstract pages
const omitSearchParams = omit(['fl', 'start', 'rows', 'id']);

/**
 * Generates a string for use in URLs, this assumes we want to include `sort` and `p` so those values
 * are normalized or added.
 *
 * @returns {string} clean search string for use after `?` in URLs.
 */
export const makeSearchParams = (params: SafeSearchUrlParams, options: { omit?: string[] } = {}) => {
  const cleanParams = omitSearchParams(params);
  return stringifySearchParams(
    omit(options.omit ?? [], {
      ...cleanParams,
      sort: normalizeSolrSort(cleanParams.sort),
      p: parseNumberAndClamp(cleanParams?.p as string, 1),
    }),
  );
};

/**
 * Wrapper around `qs.stringify` with defaults
 */
export const stringifySearchParams = (params: Record<string, unknown>, options?: qs.IStringifyOptions) =>
  qs.stringify(params, {
    indices: false,
    arrayFormat: 'repeat',
    format: 'RFC1738',
    sort: (a, b) => a - b,
    skipNulls: true,
    ...options,
  });

export const parseSearchParams = (params: string, options?: qs.IParseOptions) =>
  qs.parse(params, { parseArrays: true, ...options });

export const purifyString = (value: string): string => {
  try {
    return DOMPurify.sanitize(value);
  } catch (e) {
    return value;
  }
};

export const purify = <T extends Record<string, unknown>>(value: T): T | string | string[] => {
  if (is(String, value)) {
    return purifyString(value as string);
  }

  if (Array.isArray(value)) {
    return value.map(purifyString);
  }

  if (is(Object, value)) {
    return Object.keys(value).reduce(
      (acc, key) => ({
        ...acc,
        [key]: Array.isArray(value[key])
          ? (value[key] as string[]).map(purifyString)
          : is(String, value[key])
          ? purifyString(value[key] as string)
          : value[key],
      }),
      value,
    );
  }

  return value;
};

/**
 * @see https://stackoverflow.com/a/9461657
 */
export const kFormatNumber = (value: number): string | number => {
  const absV = Math.abs(value);
  const sign = Math.sign(value);
  return absV > 999 ? `${sign * (Math.round(absV / 100) / 10)}k` : sign * absV;
};

export const isEmptyObject = (value: unknown) => {
  return is(Object) && keys(value).length === 0;
};

/**
 * Takes an array or simple string
 * @example
 * unwrapStringValue(['a', 'b', 'c']) ==> 'a'
 * unwrapStringValue('abc') ==> 'abc'
 * unwrapStringValue(555) ==> ''
 */
export const unwrapStringValue = pipe<[string | string[]], string, string>(
  when(isArray, head),
  when(isNotString, () => ''),
);

/**
 * Unwrap and parse an error message
 * If the error is an axios specific one, then try to grab any returned error message
 *
 */
type getErrorMessageOptions = {
  defaultMessage: string;
};
export const parseAPIError = (
  error: AxiosError<unknown> | Error | unknown,
  options: getErrorMessageOptions = {
    defaultMessage: 'Unknown Server Error',
  },
): string => {
  const pathStrings = [
    ['response', 'data', 'message'],
    ['response', 'data', 'error'],
    ['response', 'statusText'],
    ['message'],
  ];

  // return generic message if error is invalid
  if (!error || !(error instanceof Error)) {
    return options.defaultMessage;
  }

  // if error is an axios error, check for a message
  if (axios.isAxiosError(error)) {
    const message = pipe<[AxiosError], (string | undefined)[], string | undefined>(
      paths(pathStrings),
      find(isString),
    )(error);

    if (typeof message === 'string') {
      return message;
    }
  }

  return options.defaultMessage;
};
