import { escape, getOperator, getTerms, joinQueries, Operator, splitQuery } from '@/query';
import { QueryClient } from '@tanstack/react-query';
import {
  always,
  append,
  both,
  complement,
  concat,
  curry,
  dec,
  defaultTo,
  filter,
  head,
  identity,
  ifElse,
  is,
  isEmpty,
  join,
  last,
  lensProp,
  map,
  nth,
  of,
  over,
  partialRight,
  pickBy,
  pipe,
  prepend,
  replace,
  split,
  tail,
  toPairs,
  uniq,
  when,
} from 'ramda';
import { isNonEmptyString } from 'ramda-adjunct';
import { FacetLogic, OnFilterArgs } from './types';
import { isString } from '@/utils/common/guards';
import { FacetField, IADSApiSearchParams } from '@/api/search/types';
import { OBJECTS_API_KEYS } from '@/api/objects/objects';
import { IObjectsApiParams, IObjectsApiResponse } from '@/api/objects/types';

const DEFAULT_DELIMETER = '/';

// helpers
const isNotOperator = (op: Operator) => always(op === 'NOT');
const nonEmptyString = both(is(String), complement(isEmpty));
const safeGetArray = (val: string | string[]) => (Array.isArray(val) ? val : typeof val === 'string' ? of(val) : []);
const parseIntOrZero = pipe<[string], number, number>(partialRight(parseInt, [10]), defaultTo(0));
export const isRootNode = (node: string) => /^(?![1-9]\/)/.test(node);

export const getLevelFromKey = ifElse<[string], number, number>(
  isNonEmptyString,
  pipe<[string], string, number>(head, parseIntOrZero),
  always(0),
);

/**
 * Parse leaf value from id
 *
 * @example
 * `0/Smith, A` -> `Smith, A`
 * `1/Smith, A/Smith, Anthony` -> `Smith, Anthony`
 */
export const parseTitleFromKey = when(nonEmptyString, pipe<[string], string[], string>(split(DEFAULT_DELIMETER), last));
export const explodeKey = ifElse<[string], Array<string>, Array<string>>(
  isNonEmptyString,
  split(DEFAULT_DELIMETER),
  always([]),
);
export const keyToPath = pipe<[string], Array<string>, Array<string>>(explodeKey, tail);

/**
 * Strip the final part from the key, and decrement the level(prefix)
 *
 * @param key
 * @param includePrefix
 */
export const getPrevKey = (key: string, includePrefix?: boolean) => {
  const parts = explodeKey(key);

  // if there is only one part, we're at the root
  if (parts.length <= 2) {
    return null;
  }
  const newLevel = pipe(parseIntOrZero, dec)(parts[0]);

  // if there are more than 2 parts, remove the last one and decrement the level
  return includePrefix
    ? [newLevel, ...parts.slice(1, -1)].join(DEFAULT_DELIMETER)
    : parts.slice(1, -1).join(DEFAULT_DELIMETER);
};

const isHierarchical = (key: string) => /^\d\//.test(key);

/**
 * Parse root value from id
 *
 * @example
 * `0/Smith, A` -> `Smith, A`
 * `1/Smith, A/Smith, Anthony` -> `Smith, A`
 *
 * @param {string} key
 * @param {boolean} includePrefix will include the `0/` part in the result
 */
export const parseRootFromKey = (key: string, includePrefix?: boolean) =>
  when(
    nonEmptyString,
    ifElse(
      // we only parse out the root if the key is hierarchical
      isHierarchical,
      pipe<[string], string[], string>(
        split('/'),
        ifElse(always(includePrefix), pipe<[string[]], string, string>(nth(1), concat('0/')), nth(1)),
      ),

      // otherwise, just return the key
      identity,
    ),
  )(key);

/**
 * Clean up clause for proper display in i.e. filters
 */
export const cleanClause = curry((fqKey: string, clause: string) => {
  const terms = getTerms(clause);
  const operator = getOperator(clause);

  // for hierarchical facets, there is more processing to make it get the fields
  if (fqKey === 'fq_author' || fqKey === 'fq_planetary_feature' || fqKey === 'fq_uat') {
    return pipe(
      map(pipe(replace(/["\\]/g, ''), parseTitleFromKey)),

      // this will force an extra `NOT` is at the start of the string
      when(isNotOperator(operator as Operator), prepend(undefined)),
      join(` ${operator} `),
    )(terms);
  }

  return pipe(
    map(pipe(replace(/(?!")[01]\\\//g, ''), replace(/["\\]/g, ''))),
    when(isNotOperator(operator as Operator), prepend(undefined)),
    join(` ${operator} `),
  )(terms);
});

/**
 * Creates an object with the new facet query and key based on the passed in field
 *
 * @param {FacetField} field
 */
const getFQNameFromRawField = (field: FacetField) =>
  pipe<[FacetField], string[], string, { key: keyof IADSApiSearchParams; fq: string }>(split('_'), head, (key) => ({
    key: `fq_${key}` as keyof IADSApiSearchParams,
    fq: `{!type=aqp v=$fq_${key}}`,
  }))(field);

const logicToOperator = (logic: FacetLogic) => {
  switch (logic) {
    case 'limit to':
    case 'and':
      return 'AND';
    case 'or':
      return 'OR';
    case 'exclude':
      return 'NOT';
    default:
      return 'AND';
  }
};

const joinWithLogic = (field: FacetField, values: string[], logic: FacetLogic) => {
  const op = logicToOperator(logic) as Operator;
  return pipe<[string[]], string[], string[], string[], string>(
    filter(isString),
    map((value) => `${field}:"${escape(value)}"`),
    when<string[], string[]>(isNotOperator(op), prepend('*:*')),
    join(` ${op} `),
  )(values);
};

export const applyFiltersToQuery = (
  props: OnFilterArgs & { query: IADSApiSearchParams },
): Partial<IADSApiSearchParams> => {
  const { field, logic, query, values } = props;
  const { key, fq } = getFQNameFromRawField(field);

  const joinedFQ = joinWithLogic(field, values, logic);
  const keyLens = lensProp<IADSApiSearchParams>(key);
  return pipe<[IADSApiSearchParams], IADSApiSearchParams, IADSApiSearchParams>(
    // adds the new fq to the existing fq array
    over(lensProp('fq'), pipe(safeGetArray, append(fq), uniq)),

    // Generates filter query based on the current key (if necessary) and the current logic
    over(keyLens, joinQueries(joinedFQ)),
  )(query);
};

export type FilterTuple = [string, string[], string[]];

const pickByFqs = (query: IADSApiSearchParams): Partial<IADSApiSearchParams> =>
  pickBy((_, k) => String(k).startsWith('fq_'), query);

/**
 * Extracts the filter values from the query string.
 *
 * Returns a 3-tuple of values that can be used to generate the facet filters components
 */
export const getFilters = (query: IADSApiSearchParams): FilterTuple[] =>
  pipe<[IADSApiSearchParams], Partial<IADSApiSearchParams>, [string, string][], FilterTuple[]>(
    pickByFqs,
    toPairs,
    map<[string, string], FilterTuple>(([k, v]) => [
      replace('fq_', '', k),
      pipe<[string], string[], string[]>(splitQuery, map(cleanClause(k)))(v),
      splitQuery(v, { stripField: false }),
    ]),
  )(query);

// get object name from react query cache
export const getObjectName = (id: string, queryClient: QueryClient) => {
  const queryCache = queryClient.getQueryCache();
  const cache = queryCache
    .getAll()
    .find(
      (cache) =>
        cache.queryKey[0] === OBJECTS_API_KEYS.OBJECTS &&
        (cache.queryKey[1] as IObjectsApiParams).identifiers?.indexOf(id) !== -1,
    );

  const data = !!cache
    ? queryClient.getQueryData([
        OBJECTS_API_KEYS.OBJECTS,
        { identifiers: (cache.queryKey[1] as IObjectsApiParams).identifiers },
      ])
    : null;
  return data ? (data as IObjectsApiResponse)[id]?.canonical : null;
};
