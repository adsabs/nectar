import { isEmptyObject } from '@/utils';
import lucene from 'lucene';
import {
  always,
  curry,
  defaultTo,
  equals,
  is,
  join,
  map,
  pathOr,
  pipe,
  replace,
  split,
  toUpper,
  uniq,
  when,
  without,
} from 'ramda';

export type Operator = 'AND' | 'OR' | 'NOT';
const DEFAULT_OPERATOR = 'AND' as const;

/**
 * Regex to match a field
 * @example
 * `author_facet_hier:bar` -> `author_facet_heir:`
 */
const FIELD_REGEX = /[a-z_0-9]+:/gi;

export const joinConditions = (operator: Operator, conditions: string[]) =>
  pipe(defaultTo(''), join(defaultTo(' AND ', ` ${operator} `)))(conditions);

// helpers
const parse = (query: string) => lucene.parse(query);
const stringify = (ast: lucene.AST) => lucene.toString(ast);
const isNonEmptyString = (v: unknown) => typeof v === 'string' && v.length > 0;
const isUndefinedOrEmpty = (v: unknown) => typeof v === 'undefined' || (typeof v === 'string' && v.length === 0);
const stripFieldFromClause = (clause: string) => replace(FIELD_REGEX, '', clause);
const capitalizeOperators = (query: string) => query.replace(/\b(and|or|not)\b/gi, toUpper);
const appendIfString = (list: string[], result: string) => (is(String, result) ? [...list, result] : list);
export const getOperator = pipe<[string], lucene.AST, string, string>(
  parse,
  pathOr('AND', ['left', 'operator']),

  // if the operator is implicit, then it's an ''
  when(equals('<implicit>'), always('')),
);

// convert fields that the AST cannot handle into something they can
const transformQueryFields = (query: string) => {
  return (
    query
      // docs
      .replace(/docs\(([a-z0-9]+)\)/gi, 'docs:$1')
  );
};

// reverse the transforms done
const unTransformQueryFields = (query: string) => {
  return (
    query
      // docs
      .replace(/docs:([a-z0-9]+)/gi, 'docs($1)')
  );
};
const parseAndNormalize = pipe(capitalizeOperators, transformQueryFields, parse);
const stringifyQuery = pipe(stringify, unTransformQueryFields);

/**
 * Join together two queries with an operator
 *
 * @param {string} queryA
 * @param {string} queryB
 */
export const joinQueries = curry((queryB: string, queryA: string) => {
  try {
    if (isNonEmptyString(queryB)) {
      const rightAST = parseAndNormalize(queryB);

      // if the main query is empty, return the augment as a new leftOnly node
      if (isUndefinedOrEmpty(queryA)) {
        return stringifyQuery({
          left: {
            ...rightAST,
            parenthesized: true,
          },
        });
      }

      const leftAST = parseAndNormalize(queryA);

      // join the two queries with the default operator
      return stringifyQuery({
        left: {
          ...leftAST,
        },
        operator: DEFAULT_OPERATOR,
        right: {
          ...rightAST,
          parenthesized: true,
        },
      });
    }
    return queryA;
  } catch (e) {
    return queryA;
  }
});

/**
 * Takes a set of clauses and removes the first match to the clause passed in
 *
 * @param {string} clause
 * @param {string[]} clauses
 */
export const removeClauseAndStringify = (clause: string, clauses: string[]) =>
  pipe<[string[]], string[], string[], string, lucene.AST, string>(
    defaultTo([]),
    without([clause]),
    join(` ${DEFAULT_OPERATOR} `),
    parseAndNormalize,
    stringifyQuery,
  )(clauses);

/**
 * Parse and normalize query and then runs any transforms on the resultant clauses
 */
export const splitQuery = (
  query: string,
  options: { stripField?: boolean; transform?: (clause: string) => string } = { stripField: true },
) =>
  pipe(
    parseAndNormalize,
    getClauses,
    uniq,
    map(
      pipe(
        // run any transforms on the clause
        when(always(is(Function, options.transform)), options.transform),

        // remove the field from the clause
        when(always(options.stripField), stripFieldFromClause),
      ),
    ),
  )(query);

// node that has both right and left children, but the left child is NOT an AST
const onlyRightIsAST = (node: lucene.AST | lucene.Node) =>
  isBinaryAST(node) &&
  ((!isBinaryAST(node.left) && isBinaryAST(node.right)) || (!isBinaryAST(node.left) && !isBinaryAST(node.right)));

// node that has no `right` child and it's left is a leaf
const leftOnlyAndIsLeaf = (node: lucene.AST | lucene.Node) =>
  !('right' in node) && 'left' in node && !isBinaryAST(node.left);

// node that has both left and right
const isBinaryAST = (node: lucene.AST | lucene.Node): node is lucene.BinaryAST =>
  typeof node !== 'undefined' &&
  'left' in node &&
  typeof node.left !== 'undefined' &&
  'right' in node &&
  typeof node.right !== 'undefined';

/**
 * Generic walker for enumerating nodes in the AST
 *
 * @param {((node: lucene.AST | lucene.Node) => R)} transformer Callback to runs transformations on the node
 * @param {(accum: T, result: R) => T} reducer Reducing callback to collect results of the transforms
 * @param {T} initialValue Reducer starting value
 * @param {lucene.AST} root AST to walk over
 * @return {*} Final reduced value
 */
const walker = <T = string[], R = string>(
  transformer: (node: lucene.AST | lucene.Node) => R,
  reducer: (accum: T, result: R) => T,
  initialValue: T,
  root: lucene.AST,
) => {
  if (isEmptyObject(root)) {
    return initialValue;
  }
  const q: (lucene.AST | lucene.Node)[] = [root];
  let accum = initialValue;
  while (q.length > 0) {
    const node = q.shift();
    accum = reducer(accum, transformer(node));
    if ('left' in node) {
      q.push(node.left);
    }
    if ('right' in node) {
      q.push(node.right);
    }
  }
  return accum;
};

/**
 * Walks over the AST and returns all the clauses
 * This is only looking for AND'd conditions.
 *
 * @example
 * (foo OR bar) AND (baz OR qux) => [(foo OR bar), (baz OR qux)]
 *
 * @param {lucene.AST | lucene.Node} root
 */
export const getClauses = (root: lucene.AST) =>
  walker<string[], string>(
    (node) => {
      if (
        (isBinaryAST(node) && node.parenthesized && onlyRightIsAST(node)) ||
        ('left' in node && leftOnlyAndIsLeaf(node))
      ) {
        return stringify(node);
      }
    },
    appendIfString,
    [],
    root,
  );

/**
 * Walks over the AST and returns all terms except `*:*`
 *
 * @param {string} query
 */
export const getTerms = (query: string) =>
  walker(
    (node) => {
      // quote and apply prefix
      if ('term' in node && node.term !== '*' && node.term !== 'AND' && node.term !== 'OR' && node.term !== 'NOT') {
        let term = node.term;
        if (node.quoted) {
          term = `"${node.term}"`;
        }
        if (node.prefix) {
          term = `${node.prefix}${term}`;
        }
        return term;
      }
      return null;
    },
    appendIfString,
    [],
    parse(query),
  );

const LUCENE_ESCAPES = '+-!():^[]"{}~*?|&/' as const;

/**
 * Escapes a query string
 */
export const escape = pipe<[string], string[], string[], string>(
  split(''),
  map((value) => (value === '\\' || LUCENE_ESCAPES.includes(value) ? `\\${value}` : value)),
  join(''),
);
