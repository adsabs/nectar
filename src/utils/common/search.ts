import { clamp, filter, head, last, omit, uniq } from 'ramda';
import qs from 'qs';

import { isSolrSort, isString } from '@/utils/common/guards';
import { APP_DEFAULTS } from '@/config';
import { ParsedUrlQuery } from 'querystring';
import { SafeSearchUrlParams } from '@/types';
import { SolrSort } from '@/api/models';
import { IADSApiSearchParams } from '@/api/search/types';
import { logger } from '@/logger';

const IGNORED_URL_KEYS = ['fl', 'start', 'rows', 'id', 'boostType'];

/**
 * Type representing the parsed query parameters.
 *
 * ParsedQueryParams is a unified type that includes two possible types for
 * query parameters: ParsedUrlQuery and qs.ParsedQs. This type is used to
 * handle query parameters parsed from URLs.
 */
type ParsedQueryParams = ParsedUrlQuery | qs.ParsedQs;

/**
 * Normalizes URL parameters by converting all values to strings. It optionally skips specified keys.
 *
 * @template T - The type of the resultant object.
 * @param {ParsedQueryParams} query - The parsed query parameters from a URL.
 * @param {string[]} [skipKeys=[]] - An array of keys to skip normalization for.
 * @returns {T} - Normalized query parameters with values converted to strings.
 */
export const normalizeURLParams = <T extends Record<string, string> = Record<string, string>>(
  query: ParsedQueryParams,
  skipKeys: string[] = [],
): T => {
  const SKIPPED_KEYS = new Set(skipKeys);

  const convertToString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return undefined;
  };

  return Object.keys(query).reduce((result, key) => {
    if (SKIPPED_KEYS.has(key)) {
      return result;
    }

    const value = convertToString(query[key]);
    if (typeof value === 'undefined') {
      return result;
    }

    return {
      ...result,
      [key]: value,
    };
  }, {}) as T;
};

/**
 * Parses the given input and clamps the resulting number within the specified range.
 * If the input is an array, only the first element is used. If the input cannot be parsed into a number,
 * the minimum value is returned.
 *
 * @param {string | number | (number | string)[]} value - The input value to be parsed and clamped.
 * @param {number} min - The minimum value to clamp to.
 * @param {number} max - The maximum value to clamp to. Defaults to Number.MAX_SAFE_INTEGER.
 * @return {number} - The parsed and clamped number.
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
  } catch (err) {
    logger.error({ err, value, min, max }, 'Error caught while parsing number');
    return min;
  }
};

/**
 * Parses a number from the given value, checking against an array of valid enum values.
 * If the value is not a valid number or not included in the enum values, it returns
 * the first value from the enum values array as a default.
 * @param value
 * @param enumValues
 */
export const parseNumberWithEnumDefault = (
  value: string | number | (number | string)[],
  enumValues: ReadonlyArray<number>,
): number => {
  try {
    const val = Array.isArray(value) ? value[0] : value;
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    if (Number.isNaN(num)) {
      return head(enumValues);
    }
    return enumValues.includes(num) ? num : head(enumValues);
  } catch (err) {
    logger.error({ err, value, enumValues }, 'Error caught while parsing number with enum default');
    return head(enumValues);
  }
};

/**
 * Parses the query parameters from the given URL and normalizes them according to specific rules.
 *
 * @template TExtra - An optional extension of the default query parameters, defined as a record of string, number,
 *  or arrays of strings/numbers.
 *
 * @param {string} url - The URL containing the query string to parse.
 * @param {Object} [options] - Optional settings for parsing.
 * @param {SolrSort} [options.sortPostfix] - Optional postfix to append to the sort parameter.
 *
 * @returns {IADSApiSearchParams & { p?: number; n?: number } & TExtra } An object containing the parsed and normalized
 *  query parameters, including optional page (`p`) and number per page (`n`) parameters, as well as any additional
 *  parameters defined by `TExtra`.
 */
export const parseQueryFromUrl = <TExtra extends Record<string, string | number | Array<string | number>>>(
  url: string,
  { sortPostfix }: { sortPostfix?: SolrSort } = {},
): IADSApiSearchParams & { p?: number; n?: number } & TExtra => {
  const queryString = url.indexOf('?') === -1 ? '' : url.split('?')[1];
  const params = parseSearchParams(queryString) as Record<string, string | string[]>;
  const normalizedParams = normalizeURLParams(params, ['fq']);
  const q = decodeURIComponent(normalizedParams?.q ?? '');
  return {
    ...normalizedParams,
    q: q === '' ? APP_DEFAULTS.EMPTY_QUERY : q,
    sort: normalizeSolrSort(params.sort, sortPostfix),
    p: parseNumberAndClamp(normalizedParams?.p, 1),
    n: parseNumberWithEnumDefault(params?.n, APP_DEFAULTS.PER_PAGE_OPTIONS),
    ...(params.fq ? { fq: safeSplitString(params.fq) } : {}),
  } as IADSApiSearchParams & { p?: number; n?: number } & TExtra;
};

/**
 * Normalizes the given raw Solr sort value to a valid SolrSort array.
 *
 * @param {unknown} rawSolrSort - The raw sort value, which can be a string, array, or unknown type.
 * @param {SolrSort} [postfixSort] - An optional postfix sort value to append if not present.
 * @returns {SolrSort[]} An array of valid SolrSort values, guaranteed to include a tie-breaker value.
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

/**
 * Splits a string by a given delimiter or returns the array if the input is already an array.
 *
 * @param {string | string[]} value - The string to split or an array to return.
 * @param {string | RegExp} [delimiter=','] - The pattern by which to split the string.
 * @returns {string[]} - Array of substrings or the original array.
 */
export const safeSplitString = (value: string | string[], delimiter: string | RegExp = ','): string[] => {
  try {
    if (Array.isArray(value)) {
      return value;
    }
    if (isString(value)) {
      return value.split(delimiter);
    }
  } catch (err) {
    logger.error({ err }, 'Error caught while parsing string');
    return [];
  }
};

/**
 * A variable that holds a function which omits specified search parameters
 * from an object. The specified search parameters are 'fl', 'start', 'rows',
 * and 'id'.
 *
 * @type {function(Object): Object}
 */
const omitSearchParams: (arg0: object) => object = omit(IGNORED_URL_KEYS);

/**
 * Generates search parameters for constructing a URL.
 *
 * This function takes an object of search parameters and an options object
 * with an optional list of parameters to omit. It cleans the parameters,
 * normalizes the sorting order, and ensures the page number is clamped to a minimum of 1.
 *
 * @param {SafeSearchUrlParams} params - The search parameters to be included in the URL.
 * @param {Object} options - Additional options for generating search parameters.
 * @param {string[]} [options.omit] - List of parameters to be omitted.
 * @returns {string} The serialized search parameters for use in a URL.
 */
export const makeSearchParams = (params: SafeSearchUrlParams, options: { omit?: string[] } = {}): string => {
  const cleanParams = omitSearchParams(params) as SafeSearchUrlParams & { p?: number; n?: number };
  return stringifySearchParams(
    omit(options.omit ?? [], {
      ...cleanParams,
      sort: normalizeSolrSort(cleanParams.sort),
      p: parseNumberAndClamp(cleanParams?.p as unknown as string, 1),
      n: parseNumberWithEnumDefault(cleanParams?.n as unknown as string, APP_DEFAULTS.PER_PAGE_OPTIONS),
    }),
  );
};

/**
 * Converts an object of search parameters into a URL query string.
 *
 * @param {Record<string, unknown>} params - The object containing the search parameters to be stringified.
 * @param {qs.IStringifyOptions} [options] - Optional configuration for the query string formatting.
 * @returns {string} - The formatted URL query string.
 */
export const stringifySearchParams = (params: Record<string, unknown>, options?: qs.IStringifyOptions): string =>
  qs.stringify(params, {
    indices: false,
    arrayFormat: 'repeat',
    format: 'RFC1738',
    sort: (a, b) => {
      const aNum = Number(a),
        bNum = Number(b);
      const aIsNum = !isNaN(aNum) && a.trim() !== '';
      const bIsNum = !isNaN(bNum) && b.trim() !== '';
      if (aIsNum && bIsNum) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    },
    skipNulls: true,
    ...options,
  });

/**
 * Transforms a string by replacing curly quotes (“ and ”) with straight quotes (").
 *
 * @param {string} q - The input string to be transformed.
 * @returns {string} - The transformed string with curly quotes replaced by straight quotes.
 */
const qTransformers = (q: string): string => {
  if (typeof q === 'string') {
    return q.replace(/“/g, '"').replace(/”/g, '"');
  }
  return q;
};

/**
 * Parses a query string into an object with additional transformations applied to specific parameters.
 *
 * @param {string} params - The query string to parse.
 * @param {qs.IParseOptions} [options] - Optional settings to customize the parsing behavior.
 * @returns {Object} The parsed query object with transformations applied.
 */
const parseSearchParams = (params: string, options?: qs.IParseOptions): object => {
  const parsed = qs.parse(params, { parseArrays: true, charset: 'utf-8', ...options });
  parsed.q = qTransformers(parsed.q as string);
  return parsed;
};
