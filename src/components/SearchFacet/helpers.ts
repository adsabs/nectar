import { FacetField, IFacetCountsFields } from '@api';
import {
  all,
  always,
  and,
  assocPath,
  both,
  complement,
  concat,
  curry,
  either,
  filter,
  flatten,
  head,
  ifElse,
  includes,
  is,
  isEmpty,
  isNil,
  last,
  lensPath,
  lensProp,
  map,
  mapObjIndexed,
  mergeRight,
  none,
  not,
  nth,
  over,
  path,
  pipe,
  prop,
  propEq,
  reduce,
  replace,
  set,
  split,
  splitEvery,
  test,
  unless,
  values,
  when,
  __,
} from 'ramda';
import { FacetChildNode, FacetChildNodeTree, FacetCountTuple, FacetNodeTree, IFacetNode } from './types';

const nonEmptyString = both(is(String), complement(isEmpty));
const isEmptyOrNil = either(isNil, isEmpty);

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
  ifElse<[string], FacetChildNode, IFacetNode>(
    always(noChildren),
    always({ key, selected: false }),
    always({ selected: false, key, children: null, expanded: false, partSelected: false }),
  )(key);

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
  const getSelected = pipe<[FacetNodeTree], IFacetNode[], IFacetNode[], string[]>(
    values,
    filter(propEq('selected', true)),
    map(prop('key')),
  );
  const getSelectedChildren = pipe<[FacetChildNodeTree], FacetChildNode[], FacetChildNode[], string[]>(
    values,
    filter(propEq('selected', true)),
    map(prop('key')),
  );

  return concat(
    getSelected(tree),
    pipe<[FacetNodeTree], IFacetNode[], string[][], string[]>(
      values,
      map((node) => getSelectedChildren(node.children)),
      flatten,
    )(tree),
  );
};

/** Pull out the child nodes as an array */
const getChildrenNodes = (key: string) =>
  pipe<[FacetNodeTree], FacetChildNodeTree, FacetChildNode[]>(path([parseRootFromKey(key, true), 'children']), values);

/** Returns true if all children are selected */
const allChildrenSelected = (key: string) =>
  pipe<[FacetNodeTree], FacetChildNode[], boolean>(getChildrenNodes(key), all(propEq('selected', true)));

/** Returns true if no children are selected */
const noChildrenSelected = (key: string) =>
  pipe<[FacetNodeTree], FacetChildNode[], boolean>(getChildrenNodes(key), none(propEq('selected', true)));

/**
 * Main selection logic
 *
 * This takes in a key, a type, and the current tree state.
 * Returns a new tree each time, modifying props depending on action and current state
 */
export const updateSelection = (key: string, isRoot: boolean, tree: FacetNodeTree) => {
  const rootKey = isRoot ? key : parseRootFromKey(key, true);

  // initial branch, check if node is a root node
  return ifElse<[FacetNodeTree], FacetNodeTree, FacetNodeTree>(
    always(isRoot),

    // ROOT -- check if it is selected
    ifElse<[FacetNodeTree], FacetNodeTree, FacetNodeTree>(
      isSelected(key, true),

      // is SELECTED
      over(keyLens(key), pipe(setSelected(false), setPartSelected(false), setChildrenSelected(false))),

      // is NOT selected
      over(keyLens(key), pipe(setSelected(true), setPartSelected(false), setChildrenSelected(true))),
    ),

    // CHILD -- check if it is selected
    ifElse<[FacetNodeTree], FacetNodeTree, FacetNodeTree>(
      isSelected(key, false),

      // is SELECTED
      pipe(
        // unselect the root node
        over(keyLens(rootKey), pipe(setSelected(false), setPartSelected(true))),
        // unselect the child node
        over(childLens(key), setSelected(false)),
        // if the resultant state has no children selected, unset the indeterminate state on root
        when(noChildrenSelected(rootKey), over(keyLens(rootKey), pipe(setPartSelected(false)))),
      ),

      // is NOT selected
      pipe(
        // select the child node
        over(childLens(key), setSelected(true)),
        // set the root as indeterminate
        over(keyLens(rootKey), pipe(setPartSelected(true))),
        // if, after selecting the child, the resulting state has all children selected, then select the root
        when(allChildrenSelected(rootKey), over(keyLens(rootKey), pipe(setSelected(true), setPartSelected(false)))),
      ),
    ),
  )(tree);
};
