import {FacetField, IADSApiSearchParams, IFacetCountsFields} from '@api';
import {escape, getOperator, getTerms, joinQueries, Operator, removeClauseAndStringify, splitQuery} from '@query';
import {defaultQueryParams} from '@store/slices';
import {isIADSSearchParams, isString} from '@utils';
import {
  __,
  allPass,
  always,
  and,
  append,
  assoc,
  assocPath,
  both,
  complement,
  concat,
  curry,
  defaultTo,
  dissoc,
  either,
  equals,
  filter,
  flatten,
  has,
  head,
  ifElse,
  includes,
  is,
  isEmpty,
  isNil,
  join,
  keys,
  last,
  lensPath,
  lensProp,
  map,
  mapObjIndexed,
  mergeRight,
  none,
  not,
  nth,
  of,
  omit,
  over,
  path,
  pickBy,
  pipe,
  prepend,
  propEq,
  propIs,
  propSatisfies,
  reduce,
  reject,
  replace,
  set,
  split,
  splitEvery,
  test,
  toPairs,
  uniq,
  unless,
  values,
  when,
} from 'ramda';
import {isNilOrEmpty, stubNull} from 'ramda-adjunct';
import {
  FacetChildNode,
  FacetChildNodeTree,
  FacetCountTuple,
  FacetLogic,
  FacetNodeTree,
  IFacetNode,
  OnFilterArgs,
} from './types';

// helpers
const isNotOperator = (op: Operator) => always(op === 'NOT');
const nonEmptyString = both(is(String), complement(isEmpty));
const isEmptyOrNil = either(isNil, isEmpty);
const safeGetArray = (val: string | string[]) => (Array.isArray(val) ? val : typeof val === 'string' ? of(val) : []);

export const isRootNode = (node: string) => /^(?![1-9]\/)/.test(node);

export const getParentId = (node: string): string | null => (isRootNode(node) ? null : parseRootFromKey(node, true));

/**
 * Parse leaf value from id
 *
 * @example
 * `0/Smith, A` -> `Smith, A`
 * `1/Smith, A/Smith, Anthony` -> `Smith, Anthony`
 */
export const parseTitleFromKey = when(nonEmptyString, pipe<[string], string[], string>(split('/'), last));

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
    and(nonEmptyString, test(/\//)),
    pipe<[string], string[], string>(
      split('/'),
      ifElse(always(includePrefix), pipe<[string[]], string, string>(nth(1), concat('0/')), nth(1)),
    ),
  )(key);

/** split facet data into tuples */
const splitIntoFacetTuples = (list: (string | number)[]) => splitEvery(2, list) as FacetCountTuple[];

/**
 * Partitions incoming facet data and returns Facet data nodes for use in the tree
 *
 * @example
 * `["0/Wang, J", 1898, "0/Henning, T", 1866]` ->
 `[
 { "key": "0/Wang, J", "count": 1898, "title": "Wang, J" },
 { "key": "0/Henning, T", "count": 1866, "title": "Henning, T" }
 ]`
 */
export const parseFacetDataIntoTuples = (
  field: FacetField,
  data: IFacetCountsFields,
  property: keyof IFacetCountsFields,
  filterStrings?: string[],
) =>
  ifElse(
    either(isEmpty, isNil),
    always<FacetCountTuple[]>([]),
    pipe<[IFacetCountsFields], (string | number)[], FacetCountTuple[], FacetCountTuple[]>(
      path([property, field]),
      ifElse(isNil, always<FacetCountTuple[]>([]), splitIntoFacetTuples),
      when(() => is(Array, filterStrings), filter(pipe(head, includes(__, filterStrings)))),
    ),
  )(data);

/**
 * maps [['0/smith, a', 10]] to { '0/smith, a': 10 }
 */
export const mapTuples = (tuples: FacetCountTuple[]) =>
  ifElse<[FacetCountTuple[]], Record<string, number>, Record<string, number>>(
    either(isEmpty, isNil),
    always({}),
    reduce<FacetCountTuple, Record<string, number>>((acc, [id, count]) => ({ ...acc, [id]: count }), {}),
  )(tuples);

/**
 * Applies the proper prefix for a child node
 */
export const rootToChildPrefix = (name: string) => unless<string, string>(isEmptyOrNil, replace(/^0/, '1'))(name);

/**
 * Creates a basic FacetNode or FacetChildNode for insertion into tree
 */
const createNode = (key: string, noChildren?: boolean) =>
  noChildren
    ? ({ key, selected: false } as FacetChildNode)
    : ({ selected: false, key, children: null, expanded: false, partSelected: false } as IFacetNode);

/**
 * Initializes a FacetNodeTree or a child tree
 */
export const initTree = <T extends FacetNodeTree | FacetChildNodeTree>(keys: string[], noChildren?: boolean) =>
  reduce<string, T>((acc, key) => ({ ...acc, [key]: createNode(key, noChildren) }), {} as T, keys);

/**
 * Add children to a specific key on the tree
 */
export const addChildren = (key: string, children: string[], tree: FacetNodeTree) =>
  over(lensPath<FacetNodeTree, FacetChildNode>([key, 'children']), mergeRight(initTree(children, true)))(tree);

/**
 * Generic toggle prop helper
 */
const toggle = curry((key: string, prop: keyof IFacetNode, tree: FacetNodeTree | FacetChildNodeTree) =>
  assocPath([key, prop], not(path([key, prop], tree)), tree),
);

/**
 * Toggle the expand property on node
 */
export const toggleExpand = (key: string, tree: FacetNodeTree): FacetNodeTree => toggle(key, 'expanded', tree);

/**
 * Depending on the type of node, this will return it's selected state
 */
export const isSelected = curry((key: string, isRoot: boolean, tree: FacetNodeTree) =>
  ifElse<[FacetNodeTree], boolean, boolean>(
    always(isRoot),
    path([key, 'selected']),
    path([parseRootFromKey(key, true), 'children', key, 'selected']),
  )(tree),
);

// lens
const keyLens = (prop: string) => lensProp<FacetNodeTree>(prop);
const childLens = (key: string) =>
  lensPath<FacetNodeTree, FacetChildNode>([parseRootFromKey(key, true), 'children', key]);
const setSelected = <T extends IFacetNode | FacetChildNode>(value: boolean) =>
  set<T, boolean>(lensProp('selected'), value);
const setPartSelected = (value: boolean) => set<IFacetNode, boolean>(lensProp('partSelected'), value);

// maps over children and sets their selected value to the argument
const setChildrenSelected = (value: boolean) =>
  over<IFacetNode, FacetChildNodeTree>(
    lensProp('children'),
    mapObjIndexed(over(lensProp<FacetChildNode>('selected'), always(value))),
  );

/**
 * Find all selected nodes and extract their keys into an array
 */
export const getAllSelectedKeys = (tree: FacetNodeTree) => {
  const isSelected = propEq('selected', true);
  const getSelected = <T extends FacetNodeTree | FacetChildNodeTree>(tree: T) =>
    pipe<[T], string[], string[]>(
      keys,
      filter<keyof T>((key) => isSelected(tree[key])),
    )(tree);

  return concat(
    getSelected<FacetNodeTree>(tree),
    pipe<[FacetNodeTree], IFacetNode[], string[][], string[]>(
      values,
      map((node) => getSelected<FacetChildNodeTree>(node.children)),
      flatten,
    )(tree),
  );
};

/** Pull out the child nodes as an array */
const getChildrenNodes = (key: string) =>
  pipe<[FacetNodeTree], FacetChildNodeTree, FacetChildNode[]>(path([parseRootFromKey(key, true), 'children']), values);

/** Returns true if no children are selected */
const noChildrenSelected = (key: string) =>
  pipe<[FacetNodeTree], FacetChildNode[], boolean>(getChildrenNodes(key), none(propEq('selected', true)));

const isFacetChildNode = (node: unknown): node is FacetChildNode => {
  return allPass([propIs(String, 'key'), propIs(Boolean, 'selected')])(node);
};

const isIFacetNode = (node: unknown): node is IFacetNode => {
  return allPass([
    propIs(String, 'key'),
    propIs(Boolean, 'selected'),
    propIs(Boolean, 'partSelected'),
    propIs(Boolean, 'expanded'),
    has('children'),
  ])(node);
};
/**
 * Main selection logic
 *
 * This takes in a key, a type, and the current tree state.
 * Returns a new tree each time, modifying props depending on action and current state
 */
export const updateSelection = (key: string, isRoot: boolean, tree: FacetNodeTree) => {
  const rootKey = isRoot ? key : parseRootFromKey(key, true);

  // if the node is empty (or undefined) create a new one before running updates
  const createNodeIfNecessary = <T extends IFacetNode | FacetChildNode>(node: T): T => {
    if ((isRoot && isIFacetNode(node)) || isFacetChildNode(node)) {
      return node;
    }

    return createNode(key, isRoot) as T;
  };

  // ROOT -- check if it is selected
  const updateRoot = ifElse<[FacetNodeTree], FacetNodeTree, FacetNodeTree>(
    isSelected(key, true),

    // is SELECTED
    over(
      keyLens(key),
      pipe(createNodeIfNecessary, setSelected(false), setPartSelected(false), setChildrenSelected(false)),
    ),

    // is NOT selected
    over(
      keyLens(key),
      pipe(createNodeIfNecessary, setSelected(true), setPartSelected(false), setChildrenSelected(false)),
    ),
  );

  // CHILD -- check if it is selected
  const updateChild = ifElse<[FacetNodeTree], FacetNodeTree, FacetNodeTree>(
    isSelected(key, false),

    // is SELECTED
    pipe(
      // unselect the root node
      over(keyLens(rootKey), pipe(createNodeIfNecessary, setSelected(false), setPartSelected(true))),
      // unselect the child node
      over(childLens(key), pipe(createNodeIfNecessary, setSelected(false))),
      // if the resultant state has no children selected, unset the indeterminate state on root
      when(noChildrenSelected(rootKey), over(keyLens(rootKey), setPartSelected(false))),
    ),

    // is NOT selected
    pipe(
      // select the child node
      over(childLens(key), pipe(createNodeIfNecessary, setSelected(true))),
      // set the root as indeterminate
      over(keyLens(rootKey), pipe(createNodeIfNecessary, setPartSelected(true))),
      // if, after selecting the child, the resulting state has all children selected, then select the root
      // when(allChildrenSelected(rootKey), over(keyLens(rootKey), pipe(setSelected(true), setPartSelected(false)))),
    ),
  );

  // initial branch, check if node is a root node
  return ifElse<[FacetNodeTree], FacetNodeTree, FacetNodeTree>(always(isRoot), updateRoot, updateChild)(tree);
};

/**
 * deselect && un-expand all entries and returns the updated tree
 */
export const resetTree = (tree: FacetNodeTree): FacetNodeTree =>
  map(
    pipe(
      // set the main props all to false
      set(lensProp('expanded'), false),
      set(lensProp('selected'), false),
      set(lensProp('partSelected'), false),

      // run over children setting empty values to null, and otherwise setting `selected: false`
      over(
        lensProp('children'),
        ifElse(isNilOrEmpty, stubNull, (node: FacetChildNodeTree) => mapObjIndexed(assoc('selected', false), node)),
      ),
    ),
    tree,
  );

/**
 * Clean up clause for proper display in i.e. filters
 */
export const cleanClause = curry((fqKey: string, clause: string) => {
  const terms = getTerms(clause);
  const operator = getOperator(clause);

  // for authors, there is more processing to make it get the names
  if (fqKey === 'fq_author') {
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
 * Takes a clause and a set of clauses and generates the fq params that should
 * be added/updated to the query
 */
export const removeClauseFromFQ = (key: string, clause: string, clauses: string[], query: IADSApiSearchParams) => {
  // generate a new list with the clause removed
  const fqValue = removeClauseAndStringify(clause, clauses);
  const equalsFQKey = equals(`{!type=aqp v=$${key}}`);
  const fqIsEmpty = propSatisfies(isEmpty, 'fq');
  const dissocKey = when(isIADSSearchParams, dissoc(key));

  // strip the fq key if it is empty
  const removeFQ = when(
    isIADSSearchParams,
    pipe<[IADSApiSearchParams], IADSApiSearchParams, IADSApiSearchParams>(
      over(lensProp('fq'), ifElse(is(Array), reject(equalsFQKey), always(undefined))),
      when(fqIsEmpty, dissoc('fq')),
    ),
  );

  return pipe(
    defaultTo(defaultQueryParams),
    ifElse(always(isEmpty(fqValue)), pipe(dissocKey, removeFQ), assoc(key, fqValue)),
  )(query);
};

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

/**
 * Clears all the filters from the query string
 */
export const clearFilters = (query: IADSApiSearchParams): IADSApiSearchParams => {
  const filters = pipe(pickByFqs, keys)(query);

  return omit([...filters, 'fq'])(query) as IADSApiSearchParams;
};
