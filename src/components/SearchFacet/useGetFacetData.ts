import { FacetField, IADSApiSearchParams, useGetSearchFacetJSON } from '@api';
import { calculatePagination } from '@components/ResultList/Pagination/usePagination';
import { parseRootFromKey } from '@components/SearchFacet/helpers';
import { FacetCountTuple } from '@components/SearchFacet/types';
import { useDebounce } from '@hooks';
import { AppState, useStore } from '@store';
import { omit } from 'ramda';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface IUseGetFacetDataProps {
  field: FacetField;
  query?: string;
  key: string;
  level: 'root' | 'child';
  sortDir?: 'asc' | 'desc';
  initialPage?: number;
  enabled?: boolean;
}

export const FACET_DEFAULT_LIMIT = 10;
export const FACET_DEFAULT_PREFIX = '0/';
export const FACET_DEFAULT_CHILD_PREFIX = '1/';

const querySelector = (state: AppState) => omit(['fl', 'start', 'rows'], state.latestQuery) as IADSApiSearchParams;

export const useGetFacetData = (props: IUseGetFacetDataProps) => {
  const searchQuery = useStore(querySelector);
  const { field, query = '', sortDir = 'desc', level = 'root', key, initialPage = 0, enabled = true } = props;
  const [pagination, setPagination] = useState(() =>
    calculatePagination({ page: initialPage, numPerPage: FACET_DEFAULT_LIMIT }),
  );

  useEffect(() => console.log(pagination), [pagination]);

  const params = useDebounce(
    useMemo(
      () => ({
        'json.facet': getSearchFacetParams({ field, key, query, level, sortDir, offset: pagination.startIndex }),
        ...searchQuery,
      }),
      [searchQuery, field, key, query, level, sortDir, pagination.startIndex],
    ),
    300,
  );

  // fetch the data
  const { data, ...result } = useGetSearchFacetJSON(params, {
    enabled,
    keepPreviousData: true,
  });

  const res = data?.[field];

  const treeData = (res?.buckets?.map((entry) => [entry.val, entry.count]) ?? []) as FacetCountTuple[];

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

  return {
    treeData,
    totalResults: res?.numBuckets ?? 0,
    pagination,
    handlePrevious,
    handleLoadMore,
    handlePageChange,
    canLoadMore: !pagination.noNext,
    ...result,
  };
};

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
      sort: { count: props.sortDir },
      numBuckets: true,
      prefix: `${props.level === 'root' ? FACET_DEFAULT_PREFIX : FACET_DEFAULT_CHILD_PREFIX}${
        parseRootFromKey(props.key) ?? ''
      }`,
    },
  });
};
