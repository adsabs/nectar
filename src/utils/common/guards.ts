import { is, keys, propIs } from 'ramda';
import { NumPerPageType } from '@/types';
import { APP_DEFAULTS } from '@/config';
import { isPlainObject } from 'ramda-adjunct';
import { BiblibSort, SolrSort } from '@/api/models';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';

/**
 * Determines if the current environment is a browser.
 *
 * This function checks if the `window` object is defined, which is a common indication of a browser environment.
 *
 * @function
 * @returns {boolean} - Returns `true` if the current environment is a browser; `false` otherwise.
 */
export const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Checks if a given value is of type NumPerPageType.
 *
 * This utility function validates whether the provided number is included in the defined
 * default pagination options (`PER_PAGE_OPTIONS`) from the application's default settings (`APP_DEFAULTS`).
 *
 * @param {number} value - The value to be checked against default pagination options.
 * @returns {boolean} - Returns true if the value is a valid NumPerPageType; otherwise, false.
 */
export const isNumPerPageType = (value: number): value is NumPerPageType => {
  return APP_DEFAULTS.PER_PAGE_OPTIONS.includes(value as NumPerPageType);
};

/**
 * Determines if a given string is a valid Solr sort parameter.
 *
 * The function checks if the input string matches one of the recognized Solr
 * sort parameters such as 'author_count asc', 'author_count desc', etc. It ensures
 * that the string is a valid sort criteria for Solr querying.
 *
 * @param maybeSolrSort - The string to be checked against the list of valid Solr sort parameters.
 * @returns Returns true if the input string is a valid Solr sort parameter, otherwise false.
 */
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

/**
 * Determines if a given string matches the criteria for BiblibSort.
 *
 * @param {string} maybeBiblibSort - The string to be evaluated
 * @returns {boolean} True if the string is a valid BiblibSort, otherwise false
 */
export const isBiblibSort = (maybeBiblibSort: string): maybeBiblibSort is BiblibSort => {
  return ['time asc', 'time desc'].includes(maybeBiblibSort);
};

/**
 * A type guard function that checks if the given value is a string.
 *
 * @param {unknown} maybeString - The value to be checked.
 * @returns {maybeString is string} - Returns true if the value is a string, otherwise false.
 */
export const isString = (maybeString: unknown): maybeString is string => typeof maybeString === 'string';

/**
 * A type guard function that checks if a given value conforms to the IADSApiSearchResponse interface.
 *
 * This function examines whether the input object has the required structure of an API search response.
 * Specifically, it ensures that:
 * 1. The 'responseHeader' property exists and is an object.
 * 2. At least one of the following properties exists and is an object: 'response', 'error', or 'stats'.
 *
 * @param {unknown} value - The value to be checked.
 * @returns {boolean} - Returns true if the value matches the IADSApiSearchResponse interface, otherwise false.
 */
export const isApiSearchResponse = (value: unknown): value is IADSApiSearchResponse => {
  return (
    propIs(Object, 'responseHeader', value) &&
    (propIs(Object, 'response', value) || propIs(Object, 'error', value) || propIs(Object, 'stats', value))
  );
};

/**
 * Type guard function to check if a given value is of the type IADSApiSearchParams.
 *
 * This function ensures that the value is a plain object and has a property 'q'
 * that is a string. Primarily used to validate the search parameters intended for
 * IADS API operations.
 *
 * @param {unknown} value - The value to be checked.
 * @returns {boolean} Returns true if the value is a valid IADSApiSearchParams object, false otherwise.
 */
export const isIADSSearchParams = (value: unknown): value is IADSApiSearchParams => {
  return isPlainObject(value) && propIs(String, 'q', value);
};

/**
 * Checks if the provided value is an empty object.
 *
 * This function determines if the input `value` is an object and whether it contains no enumerable properties.
 *
 * @param {unknown} value - The value to be checked.
 * @returns {boolean} - Returns `true` if the value is an object with no enumerable properties, otherwise `false`.
 */
export const isEmptyObject = (value: unknown) => {
  return is(Object) && keys(value).length === 0;
};
