import { IADSApiSearchParams, queryFields, solrSorts } from '@api';
import { joinQueries, removeClauseAndStringify, splitQuery } from '@query';
import { defaultQueryParams } from '@store/slices';
import { normalizeSolrSort } from '@utils';
import {
  append,
  assoc,
  curry,
  dissoc,
  ifElse,
  keys,
  Lens,
  lensProp,
  map,
  omit,
  over,
  pickBy,
  pipe,
  propOr,
  propSatisfies,
  replace,
  startsWith,
  toPairs,
  uniq,
  when,
  without,
} from 'ramda';
import { isEmptyArray } from 'ramda-adjunct';

export type Query = Partial<IADSApiSearchParams> & { [key: string]: unknown };
type Tuple<T = string> = [T, T];

export const createQuery = (params: Partial<Query> = {}) => {
  return {
    ...defaultQueryParams,
    sort: normalizeSolrSort(params?.sort),
    ...params,
  } as Query;
};

const FQPrefix = 'fq_' as const;
const pickByFQs = (query: Query) => pickBy<Query, Partial<Query>>((_, k) => startsWith(FQPrefix, k as string), query);
const stripFQPrefix = replace(FQPrefix, '');
const applyFQPrefix = (v: string) => `${FQPrefix}${v}`;
const makeFQHeader = (name: string) => `{!type=aqp v=$${applyFQPrefix(name)}}`;
const fQHeaderLens = lensProp<Query>('fq') as Lens<Query, string[]>;
const fQPrefixedLens = (key: string) => lensProp<Query>(applyFQPrefix(key)) as Lens<Query, string>;
const removeFQ = curry((key: string, query: Query) =>
  pipe<[Query], Query, Query>(dissoc(applyFQPrefix(key)), removeFQHeader(key))(query),
);

const setFQHeader = curry((name: string, query: Query) =>
  over(fQHeaderLens, pipe(append(makeFQHeader(name)), uniq), query),
);

const removeFQHeader = curry(
  (key: string, query: Query): Query =>
    pipe<[Query], Query, Query>(
      // remove the header
      over(fQHeaderLens, without([makeFQHeader(key)])),

      // if fq is now empty, remove the whole prop from the query
      when(propSatisfies(isEmptyArray, 'fq'), dissoc('fq')),
    )(query),
);

/**
 * Clears FQs from the Query object
 */
export const clearFQs = (query: Query) => {
  const fQs = pipe(pickByFQs, keys)(query);
  return omit([...fQs, 'fq'], query);
};

/**
 * Sets a new FQ or adds to an existing one
 */
export const setFQ = (name: string, value: string, query: Query, options: { asIs?: boolean } = {}) => {
  return pipe(
    // set the FQ header on the object `fq: [foo, bar, baz]`
    setFQHeader(name),

    // take incoming fq value and join it with the current one (if it exists)
    over(
      fQPrefixedLens(name),
      ifElse(
        () => options.asIs,
        () => value,
        joinQueries(value),
      ),
    ),
  )(query);
};

/**
 * Gets all the FQs as key-value tuples
 *
 * This also strips the prefix from each key
 *
 * @example
 * [
 *   ['author', '(author_facet_hier:"0\\/Henning, T")'],
 *   ['bibstem', '(bibstem_facet:"ApJ")']
 * ]
 */
export const getFQs = (query: Query) => {
  return pipe<[Query], Partial<Query>, Tuple[], Tuple[]>(
    pickByFQs,
    toPairs,
    map(([k, v]) => [stripFQPrefix(k), v]),
  )(query);
};

/**
 * Gets the value for an FQ param
 * Returns an empty string if the FQ param doesn't exist
 */
export const getFQValue = (name: string, query: Query): string => propOr('', applyFQPrefix(name), query);

/**
 * Takes an FQ name and a clause to remove
 * It will return a new Query with the clause removed from the FQ param
 */
export const removeFQClause = (name: string, clause: string, query: Query) => {
  const rawFQValue = getFQValue(name, query);

  // if the fq is empty, remove the header and return
  if (rawFQValue === '') {
    return (removeFQHeader as (name: string, q: Query) => Query)(name, query);
  }

  // split and remove the clause from the query
  const newFQValue = removeClauseAndStringify(clause, splitQuery(rawFQValue, { stripField: false }));

  // if after removing FQ value it's empty, remove the header and return
  if (newFQValue === '') {
    return removeFQ(name, query);
  }

  // return the query with the new FQ value applied
  return assoc(applyFQPrefix(name), newFQValue, query) as Query;
};

import { z } from 'zod';
const QuerySchema = z
  .object({
    q: z.string(),
    rows: z.number(),
    sort: z.array(z.enum(solrSorts)),
    start: z.number(),
    'stats.field': z.string(),
    stats: z.boolean(),
    bigquery: z.string(),
    cursorMark: z.string(),
    'facet.field': z.string(),
    'facet.limit': z.number(),
    'facet.mincount': z.number(),
    'facet.offset': z.number(),
    'facet.pivot': z.string(),
    'facet.prefix': z.string(),
    'facet.query': z.string(),
    facet: z.boolean(),
    fl: z.array(z.enum(queryFields)),
    fq: z.array(z.string()),
    'hl.fl': z.string(),
    'hl.maxAnalyzedChars': z.number(),
    'hl.requireFieldMatch': z.boolean(),
    'hl.usePhraseHighlighter': z.boolean(),
    hl: z.boolean(),
    'json.facet': z.string(),
  })
  .passthrough()
  .partial();

export const parseQuery = (maybeQuery: Query): IADSApiSearchParams => {
  return QuerySchema.parse(maybeQuery) as IADSApiSearchParams;
};
