import { FacetField, IADSApiSearchParams, useGetSearchFacetJSON } from '@api';
import { calculatePagination } from '@components/ResultList/Pagination/usePagination';
import { getParentId, parseRootFromKey } from '@components/SearchFacet/helpers';
import { useFacetStore } from '@components/SearchFacet/store/FacetStore';
import { FacetItem } from '@components/SearchFacet/types';
import { useDebounce } from '@hooks';
import { AppState, useStore } from '@store';
import { sanitize } from 'dompurify';
import { omit } from 'ramda';
import { isNonEmptyArray } from 'ramda-adjunct';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface IUseGetFacetDataProps {
  field: FacetField;
  query?: string;
  prefix: string;
  level: 'root' | 'child';
  sortDir?: 'asc' | 'desc';
  sortField?: 'index' | 'count';
  initialPage?: number;
  filter?: string[];
  enabled?: boolean;
  hasChildren?: boolean;
}

export const FACET_DEFAULT_LIMIT = 10;
export const FACET_DEFAULT_PREFIX = '0/';
export const FACET_DEFAULT_CHILD_PREFIX = '1/';

const querySelector = (state: AppState) => omit(['fl', 'start', 'rows'], state.latestQuery) as IADSApiSearchParams;

export const useGetFacetData = (props: IUseGetFacetDataProps) => {
  const searchQuery = useStore(querySelector);
  const {
    field,
    query = '',
    sortDir = 'desc',
    sortField = 'count',
    level = 'root',
    prefix,
    enabled = true,
    hasChildren = false,
    filter = [],
  } = props;

  const [pagination, setPagination] = useState(() => calculatePagination({ page: 0, numPerPage: FACET_DEFAULT_LIMIT }));

  // on prefix change (search, letter, sort) reset back to page 0
  useEffect(() => {
    setPagination(calculatePagination({ page: 0, numPerPage: FACET_DEFAULT_LIMIT }));
  }, [prefix]);

  const params = useDebounce(
    useMemo(
      () => ({
        'json.facet': getSearchFacetParams({
          field,
          prefix,
          query,
          level,
          sortField,
          sortDir,
          offset: pagination.startIndex,
          hasChildren,
        }),
        ...searchQuery,
      }),
      [searchQuery, field, prefix, query, level, sortDir, sortField, pagination.startIndex, hasChildren],
    ),
    300,
  );

  // fetch the data
  const { data, ...result } = useGetSearchFacetJSON(params, {
    enabled,
    keepPreviousData: true,
  });

  const res = data?.[field];
  const treeData = res?.buckets?.reduce<FacetItem[]>((acc, entry) => {
    // filter out entries, if necessary
    if (isNonEmptyArray(filter) && !filter.includes(entry.val as string)) {
      return acc;
    }

    // generate a new entry for the bucket
    const parentId = getParentId(entry.val as string);
    return [
      ...acc,
      {
        ...entry,
        id: entry.val,
        parentId: parentId !== null ? parentId : null,
      } as FacetItem,
    ];
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!pagination.noNext) {
      setPagination(({ nextPage }) =>
        calculatePagination({
          numFound: res?.numBuckets ?? 0,
          page: nextPage,
          numPerPage: FACET_DEFAULT_LIMIT,
        }),
      );
    }
  }, [res?.numBuckets, pagination]);

  const handlePrevious = useCallback(() => {
    if (!pagination.noPrev) {
      setPagination(({ prevPage }) =>
        calculatePagination({
          numFound: res?.numBuckets ?? 0,
          page: prevPage,
          numPerPage: FACET_DEFAULT_LIMIT,
        }),
      );
    }
  }, [res?.numBuckets, pagination]);

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination(
        calculatePagination({
          numFound: res?.numBuckets ?? 0,
          page,
          numPerPage: FACET_DEFAULT_LIMIT,
        }),
      );
    },
    [res?.numBuckets],
  );

  // After creation, add the nodes to the state to optimize rendering
  const addNodes = useFacetStore((state) => state.addNodes);
  useEffect(() => {
    if (treeData?.length > 0) {
      addNodes(treeData);
    }
  }, [treeData]);

  return {
    treeData,
    totalResults: res?.numBuckets ?? 0,
    pagination: pagination,
    handlePrevious,
    handleLoadMore,
    handlePageChange,
    canLoadMore: res?.numBuckets !== treeData?.length,
    ...result,
  };
};

/**
 * Generate the proper prefix given the level of the incoming key
 * Appends a '/' to child prefixes to restrict results
 * @param level
 * @param key
 */
const getPrefix = (level: IUseGetFacetDataProps['level'], key: string) =>
  `${level === 'root' ? FACET_DEFAULT_PREFIX : FACET_DEFAULT_CHILD_PREFIX}${parseRootFromKey(key) ?? ''}${
    level === 'child' ? '/' : ''
  }`;

const getSearchFacetParams = (props: IUseGetFacetDataProps & { offset: number }) => {
  if (!props || !props.field) {
    return '';
  }

  return JSON.stringify({
    [props.field]: {
      type: 'terms',
      field: props.field,
      limit: FACET_DEFAULT_LIMIT,
      mincount: 1,
      offset: props.offset,
      numBuckets: true,
      // sort: `${props.sortField} ${props.sortDir}`,
      sort: `count ${props.sortDir}`,
      ...(props.query ? { query: props.query } : {}),
      ...(props.hasChildren
        ? { prefix: getPrefix(props.level, sanitize(props.prefix)) }
        : { prefix: sanitize(props.prefix) }),
    },
  });
};
