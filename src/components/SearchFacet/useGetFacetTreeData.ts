import { IADSApiSearchParams, IFacetCountsFields, useGetSearchFacetCounts } from '@api';
import { AppState, useStore } from '@store';
import { equals, head, omit, uniqBy } from 'ramda';
import { Reducer, useCallback, useEffect, useReducer } from 'react';
import { parseFacetDataIntoTuples, rootToChildPrefix } from './helpers';
import { FacetCountTuple, IFacetParams } from './types';

export type UseGetFacetTreeDataProps =
  | {
      type: 'root';
      field: IFacetParams['field'];
      property: keyof IFacetCountsFields;
      facetQuery?: IFacetParams['query'];
      rawPrefix?: never;
      enabled?: boolean;
      hasChildren?: boolean;
      filter?: string[];
    }
  | {
      type: 'child';
      field: IFacetParams['field'];
      property: keyof IFacetCountsFields;
      facetQuery?: IFacetParams['query'];
      rawPrefix: string;
      enabled?: boolean;
      hasChildren?: boolean;
      filter?: string[];
    };

const querySelector = (state: AppState) => omit(['fl', 'start', 'rows'], state.latestQuery);

interface ITreeDataGetterState {
  query: IADSApiSearchParams;
  offset: number;
  treeData: FacetCountTuple[];
  canLoadMore: boolean;
}
type TreeDataGetterEvent =
  | { type: 'RESET' }
  | { type: 'MORE' }
  | { type: 'DATA'; payload: FacetCountTuple[] }
  | { type: 'SET_QUERY'; payload: IADSApiSearchParams };

const initialState: ITreeDataGetterState = {
  query: { q: '*:*' },
  offset: 0,
  treeData: [],
  canLoadMore: true,
};
const reducer: Reducer<ITreeDataGetterState, TreeDataGetterEvent> = (state, action) => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...initialState, query: action.payload };
    case 'MORE':
      return { ...state, offset: state.treeData.length };
    case 'DATA':
      return {
        ...state,
        treeData: uniqBy(head, [...state.treeData, ...action.payload]),
        canLoadMore: action.payload.length === DEFAULT_LIMIT,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const useGetFacetTreeData = (props: UseGetFacetTreeDataProps) => {
  const { type, field, rawPrefix, enabled, property, hasChildren, facetQuery, filter } = props;
  const query = useStore(querySelector);
  const [state, dispatch] = useReducer(reducer, initialState, (state) => ({
    ...state,
    query,
  }));

  // Checks if incoming query is different than previous render
  // if so, then we should set the state and force a reset
  useEffect(() => {
    if (!equals(state.query, query)) {
      dispatch({ type: 'SET_QUERY', payload: query });
    }
  }, [query]);

  const prefix = type === 'child' ? rootToChildPrefix(rawPrefix) : DEFAULT_PREFIX;
  const params = getFacetParams({
    ...state.query,
    field,
    prefix,
    offset: state.offset,
    hasChildren,
    query: facetQuery,
  });
  const { data, ...result } = useGetSearchFacetCounts(params, { enabled, retry: 0 });

  // simple handler for fetching more items, this will increment the offset
  const handleLoadMore = useCallback(() => {
    if (state.canLoadMore) {
      dispatch({ type: 'MORE' });
    }
  }, [state.canLoadMore]);

  // update internal state with new data, when something changes
  useEffect(() => {
    if (data) {
      dispatch({ type: 'DATA', payload: parseFacetDataIntoTuples(field, data, property, filter) });
    }
  }, [data, field, property, filter]);

  return { ...result, treeData: state.treeData, handleLoadMore, canLoadMore: state.canLoadMore };
};

const DEFAULT_LIMIT = 10;
const DEFAULT_PREFIX = '0/';

/**
 * Returns a set of params updated via props
 */
const getFacetParams = (props: IADSApiSearchParams & IFacetParams & { hasChildren?: boolean }): IADSApiSearchParams => {
  const { field, limit, offset, prefix, query, hasChildren, ...rest } = props;

  return {
    facet: true,
    'facet.mincount': 1,
    'facet.field': field,
    'facet.limit': limit ?? DEFAULT_LIMIT,
    'facet.offset': offset,

    // if prefix is not a root one `0/` then we should append a `/` on the end to restrict the search
    ...(hasChildren ? { 'facet.prefix': (prefix ?? DEFAULT_PREFIX) === DEFAULT_PREFIX ? prefix : `${prefix}/` } : {}),
    ...(query ? { 'facet.query': query } : {}),
    rows: 1,
    fl: ['id'],
    ...rest,
  };
};
