import { BiblibSort, IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity, IUserData, SolrSort } from '@/api';
import { APP_DEFAULTS } from '@/config';
import { NumPerPageType, SafeSearchUrlParams } from '@/types';
import axios, { AxiosError } from 'axios';
import DOMPurify from 'isomorphic-dompurify';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { useRouter } from 'next/router';
import qs from 'qs';
import { ParsedUrlQuery } from 'querystring';
import {
  adjust,
  clamp,
  compose,
  filter,
  find,
  head,
  is,
  keys,
  last,
  map,
  omit,
  paths,
  pipe,
  propIs,
  range,
  repeat,
  transpose,
  uniq,
  when,
  without,
} from 'ramda';
import { isArray, isNilOrEmpty, isNonEmptyString, isNotString, isPlainObject } from 'ramda-adjunct';
import z from 'zod';

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

export const parsePublicationDate = (pubdate: string): { year: string; month: string; day: string } | null => {
  if (isNilOrEmpty(pubdate)) {
    return null;
  }

  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match: RegExpExecArray | null = regex.exec(pubdate);

  // handle dates with year, month, and day
  if (match && match.length === 4) {
    return { year: match[1], month: match[2], day: match[3] };
  } else {
    // handle dates with only year and month
    const year = pubdate.slice(0, 4);
    const monthMatch = /^(\d{4})-(\d{2})$/.exec(pubdate);
    const month = monthMatch ? monthMatch[2] : '00';
    return { year, month, day: '00' };
  }
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
export const parseQueryFromUrl = <TExtra extends Record<string, string | number | Array<string | number>>>(
  url: string,
  { sortPostfix }: { sortPostfix?: SolrSort } = {},
) => {
  const queryString = url.indexOf('?') === -1 ? url : url.split('?')[1];
  const params = parseSearchParams(queryString) as Record<string, string | string[]>;
  const normalizedParams = normalizeURLParams(params, ['fq']);
  const q = decodeURIComponent(normalizedParams?.q ?? '');
  const numPerPage = parseNumberAndClamp(
    normalizedParams?.n,
    head(APP_DEFAULTS.PER_PAGE_OPTIONS),
    last(APP_DEFAULTS.PER_PAGE_OPTIONS),
  );

  return {
    ...normalizedParams,
    q: q === '' ? APP_DEFAULTS.EMPTY_QUERY : q,
    sort: normalizeSolrSort(params.sort, sortPostfix),
    p: parseNumberAndClamp(normalizedParams?.p, 1),
    n: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE,
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

export const isBiblibSort = (maybeBiblibSort: string): maybeBiblibSort is BiblibSort => {
  return ['time asc', 'time desc'].includes(maybeBiblibSort);
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
    return ['score desc', tieBreaker];
  }

  // filter out non-SolrSort values
  const validSort = uniq(filter(isSolrSort, sort));

  // append tieBreaker onto sort list, if not there already
  if (tieBreaker === last(validSort)) {
    return validSort;
  }

  // if all values are filtered out, return the default
  if (validSort.length === 0) {
    return ['score desc', tieBreaker];
  }

  return uniq(validSort.concat(tieBreaker));
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
    arrayFormat: 'comma',
    format: 'RFC1738',
    sort: (a, b) => a - b,
    skipNulls: true,
    ...options,
  });

const qTransformers = (q: string) => {
  if (typeof q === 'string') {
    return q.replace(/“/g, '"').replace(/”/g, '"');
  }
  return q;
};

const parseSearchParams = (params: string, options?: qs.IParseOptions) => {
  const parsed = qs.parse(params, { parseArrays: true, charset: 'utf-8', ...options });
  parsed.q = qTransformers(parsed.q as string);
  return parsed;
};

export const purifyString = (value: string): string => {
  try {
    return DOMPurify.sanitize(value);
  } catch (e) {
    return value;
  }
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
    ['user-message'],
    ['response', 'data', 'user-message'],
    ['response', 'data', 'message'],
    ['response', 'data', 'error'],
    ['response', 'statusText'],
    ['message'],
  ];

  // if it's a simple string, return it as is
  if (typeof error === 'string') {
    return error;
  }

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

  if (error instanceof Error && typeof error.message === 'string' && error.message.length > 0) {
    return error.message;
  }

  return options.defaultMessage;
};

/**
 * Capitalizes first letter of the string
 * @param str
 */
export const capitalizeString = (str: string) =>
  isNonEmptyString(str) ? `${str.slice(0, 1).toUpperCase()}${str.slice(1)}` : str;

/**
 * Helper utility that retrieves the first entry of the identifier field
 * or the single string if no array, or picks the bibcode (if available)
 * @param doc
 */
export const reconcileDocIdentifier = (doc: IDocsEntity): string => {
  // check for bibcode
  if (Object.hasOwn(doc, 'bibcode')) {
    return doc.bibcode;
  }

  // check for alternate bibcode
  if (Object.hasOwn(doc, 'alternate_bibcode')) {
    if (Array.isArray(doc.alternate_bibcode) && typeof doc.alternate_bibcode[0] === 'string') {
      return doc.alternate_bibcode[0];
    } else if (typeof doc.alternate_bibcode === 'string') {
      return doc.alternate_bibcode;
    }
  }

  // check for identifier field
  if (Object.hasOwn(doc, 'identifier')) {
    if (Array.isArray(doc.identifier) && typeof doc.identifier[0] === 'string') {
      return doc.identifier[0];
    } else if (typeof doc.identifier === 'string') {
      return doc.identifier;
    }
  }

  return null;
};

export const asyncDelay = (delay = 1000) => new Promise((resolve) => setTimeout(resolve, delay));

/**
 * Takes in a doc and tries to gather all author information into a data structure like below:
 * ```
 * [
 *    ['1', 'Zhang, Dali', 'INFN, Sezione di Pisa, I-56127 Pisa, Italy', '0000-0003-4311-5804'],
 *    ['2', 'Li, Xinqiao', '']
 * ]
 * ```
 * @param doc
 */
export const coalesceAuthorsFromDoc = (doc: IDocsEntity, includeAff?: boolean) => {
  const { author = [], aff = [], orcid_other = [], orcid_pub = [], orcid_user = [] } = doc;

  if (isNilOrEmpty(author)) {
    return [];
  }

  const len = author.length;

  return includeAff
    ? map(
        compose(
          // remove extra '-', essentially coalescing orcid value
          without(['-']),

          // replace affs with an empty string, so we don't wipe it out in the next step
          adjust(2, (v) => (v === '-' ? '' : v)),
        ),

        // stack each array
        transpose([
          map((v) => v.toLocaleString(), range(1, len + 1)),
          author,
          aff ?? repeat('', len),
          orcid_other,
          orcid_pub,
          orcid_user,
        ]),
      )
    : map(
        without(['-']),
        transpose([map((v) => v.toLocaleString(), range(1, len + 1)), author, orcid_other, orcid_pub, orcid_user]),
      );
};

export const pluralize = (str: string, count: number) => {
  return count === 1 ? str : `${str}s`;
};

export const isValidEmail = (email: string) => {
  const emailSchema = z.string().email();
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const immutableInsert = <T>(arr: T[], index: number, newItem: T): T[] => [
  ...arr.slice(0, index),
  newItem,
  ...arr.slice(index),
];

export const immutableRemove = <T>(arr: T[], index: number): T[] => [...arr.slice(0, index), ...arr.slice(index + 1)];
