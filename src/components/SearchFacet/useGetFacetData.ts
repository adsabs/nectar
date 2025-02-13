import { calculatePagination } from '@/components/ResultList/Pagination/usePagination';
import { getLevelFromKey, getPrevKey } from '@/components/SearchFacet/helpers';
import { useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { FacetItem } from '@/components/SearchFacet/types';
import { AppState, useStore } from '@/store';
import { sanitize } from 'isomorphic-dompurify';
import { isEmpty, omit } from 'ramda';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isNonEmptyArray, isNonEmptyString } from 'ramda-adjunct';
import { FacetField, IADSApiSearchParams, IBucket } from '@/api/search/types';
import { useGetSearchFacetJSON } from '@/api/search/search';
import { useObjects } from '@/api/objects/objects';

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
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export const FACET_DEFAULT_LIMIT = 10;
export const FACET_DEFAULT_PREFIX = '0/';

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
    searchTerm,
    limit,
    offset,
  } = props;

  const [pagination, setPagination] = useState(() => calculatePagination({ page: 0, numPerPage: FACET_DEFAULT_LIMIT }));

  // on prefix change (search, letter, sort) reset back to page 0
  useEffect(() => {
    setPagination(calculatePagination({ page: 0, numPerPage: FACET_DEFAULT_LIMIT }));
  }, [prefix]);

  // fetch the data
  const { data, ...result } = useGetSearchFacetJSON(
    {
      ...searchQuery,
      ['json.facet']: getSearchFacetParams({
        field,
        prefix,
        query,
        filter,
        level,
        sortField,
        sortDir,
        offset: offset ?? pagination.startIndex,
        limit,
        hasChildren,
        searchTerm,
      }),
    },
    {
      enabled,
      keepPreviousData: true,
    },
  );

  const res = data?.[field];
  const treeData = useMemo(() => formatTreeData(res?.buckets ?? [], filter), [res?.buckets, filter]);

  const identifiers = useMemo(
    () =>
      field === 'simbad_object_facet_hier' && treeData?.[0]?.level > 0
        ? treeData.map(({ val }) => val.split('/')[val.split('/').length - 1])
        : ([] as string[]),
    [treeData],
  );

  const {
    data: objects,
    isLoading,
    isFetching,
    isError,
  } = useObjects({ identifiers }, { enabled: identifiers?.length > 0 });

  const enhancedTreeData = useMemo(() => {
    if (objects && treeData) {
      return treeData.map((data) => {
        const id = data.val.split('/')[data.val.split('/').length - 1];
        return { ...data, val: data.val.replace(id, objects[id].canonical) };
      });
    } else {
      return treeData;
    }
  }, [objects, treeData]);

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
    if (enhancedTreeData?.length > 0) {
      addNodes(enhancedTreeData);
    }
  }, [enhancedTreeData]);

  return {
    treeData: enhancedTreeData,
    totalResults: res?.numBuckets ?? 0,
    pagination: pagination,
    handlePrevious,
    handleLoadMore,
    handlePageChange,
    canLoadMore: res?.numBuckets !== treeData?.length,
    ...result,
    isLoading: result.isLoading || isLoading,
    isFetching: result.isFetching || isFetching,
    isError: result.isError || isError,
  };
};

const formatTreeData = (buckets: Array<IBucket>, filter?: IUseGetFacetDataProps['filter']) => {
  const treeData: Array<FacetItem> = [];
  buckets.forEach((bucket) => {
    // exclude any values that are NOT included in the filter
    if (isNonEmptyArray(filter) && !filter.includes(bucket.val as string)) {
      return;
    }

    const parentId = getPrevKey(bucket.val as string, true);
    treeData.push({
      ...bucket,
      id: bucket.val,
      parentId,
      level: getLevelFromKey(bucket.val as string),
    } as FacetItem);
  });
  return treeData;
};

/**
 * Generate the proper prefix given the level of the incoming key
 * Appends a '/' to child prefixes to restrict results
 * @param key
 * @param searchTerm
 */
const getPrefix = (key: string, searchTerm: string) => {
  if (isEmpty(key)) {
    return `${FACET_DEFAULT_PREFIX}${isNonEmptyString(searchTerm) ? searchTerm : ''}`;
  }

  if (key === FACET_DEFAULT_PREFIX) {
    return `${key}${isNonEmptyString(searchTerm) ? searchTerm : ''}`;
  }

  const level = getLevelFromKey(key);
  return `${level + 1}${key.slice(1)}/${searchTerm}`;
};

const getSearchFacetParams = (props: IUseGetFacetDataProps & { offset: number; limit?: number }) => {
  if (!props?.field) {
    return '';
  }

  return JSON.stringify({
    [props.field]: {
      type: 'terms',
      field: props.field,
      limit: props.limit ?? FACET_DEFAULT_LIMIT,
      mincount: 1,
      offset: props.offset,
      numBuckets: true,
      sort: `count ${props.sortDir}`,
      ...(props.query ? { query: props.query } : {}),

      ...(props.hasChildren
        ? { prefix: getPrefix(props.prefix, sanitize(props.searchTerm)) }
        : { prefix: sanitize(props.searchTerm) }),
    },
  });
};
