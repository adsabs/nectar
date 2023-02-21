import { FacetField } from '@api';
import { Icon, Spinner, Text } from '@chakra-ui/react';
import { Pagination } from '@components/ResultList';
import { useFacetTreeStore } from '@components/SearchFacet/store';
import { useGetFacetData } from '@components/SearchFacet/useGetFacetData';
import { ExclamationCircleIcon } from '@heroicons/react/solid';
import { head, map } from 'ramda';
import { FC, ReactChild, useEffect } from 'react';
import { FacetCountTuple } from '../types';
import { SelectedList } from './SelectedList';

interface ISearchFacetModalWrapperProps {
  level: 'root' | 'child';
  query: string;
  field: FacetField;
  sortDir?: 'asc' | 'desc';

  initialPage?: number;
  onPageChange?: (page: number) => void;
  hasChildren?: boolean;
  children: (props: { tree: FacetCountTuple[] }) => ReactChild;
}

export const SearchFacetModalWrapper: FC<ISearchFacetModalWrapperProps> = (props) => {
  const { field, sortDir, query, level, initialPage, onPageChange, children, hasChildren } = props;
  const addChildren = useFacetTreeStore((state) => state.addChildren);

  const { treeData, pagination, handleLoadMore, handlePrevious, handlePageChange, totalResults, isFetching, isError } =
    useGetFacetData({
      field,
      key: query,
      level,
      sortDir,
      initialPage,
      hasChildren,
    });

  useEffect(() => {
    if (typeof onPageChange === 'function') {
      onPageChange(pagination.page);
    }
  }, [pagination.page]);

  // if child node, update the facet state tree with the newly loaded children
  useEffect(() => {
    if (level === 'child') {
      addChildren(map(head, treeData) as string[]);
    }
  }, [treeData, level]);

  return (
    <>
      {/* Primary loading indicator */}
      {isFetching && treeData.length === 0 && <Spinner size="sm" />}
      {!isFetching && treeData.length === 0 && <Text size="sm">No results</Text>}

      {/* Render child tree */}
      {children({ tree: treeData })}

      <SelectedList />

      <Pagination
        {...pagination}
        totalResults={totalResults}
        alwaysShow={totalResults > 0}
        skipRouting
        hidePerPageSelect
        onNext={handleLoadMore}
        onPrevious={handlePrevious}
        onPageSelect={handlePageChange}
        isLoading={isFetching}
      />

      {isError && (
        <Text color="red" fontSize="xs">
          <Icon as={ExclamationCircleIcon} /> Error loading entries
        </Text>
      )}
    </>
  );
};
