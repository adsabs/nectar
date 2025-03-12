import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Button, Flex, FlexProps, Select } from '@chakra-ui/react';
import { NumPerPageType } from '@/types';
import { useCallback } from 'react';
import { ManualPageSelect } from './ManualPageSelect';

export interface IControlledPaginationControlsProps extends FlexProps {
  entries: number;
  pageIndex: number;
  pageSize: NumPerPageType;
  onChangePageSize: (size: NumPerPageType) => void;
  onChangePageIndex: (index: number) => void;
}

export const ControlledPaginationControls = (props: IControlledPaginationControlsProps) => {
  const { entries, pageSize, pageIndex, onChangePageIndex, onChangePageSize, ...flexProps } = props;

  const pageCount = Math.ceil(entries / pageSize);

  const endIdx = pageIndex * pageSize + pageSize > entries ? entries : pageIndex * pageSize + pageSize;

  const getPaginationString = useCallback(() => {
    return `Showing ${pageIndex * pageSize + 1} to ${endIdx} of ${entries} results`;
  }, [entries, pageSize, pageIndex]);

  const handleNextPage = () => {
    onChangePageIndex(pageIndex + 1);
  };

  const handlePreviousPage = () => {
    onChangePageIndex(pageIndex - 1);
  };

  return (
    <Flex {...flexProps}>
      <Flex flex="1" data-testid="pagination-string" display={{ base: 'none', sm: 'initial' }}>
        {getPaginationString()}
      </Flex>
      <Flex justifyContent="center">
        <Select
          value={pageSize}
          onChange={(e) => onChangePageSize(e.target.value ? (Number(e.target.value) as NumPerPageType) : 10)}
          size="sm"
          data-testid="page-size-selector"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </Select>
      </Flex>
      <Flex flex="1" justifyContent="flex-end">
        <Button
          aria-label="go to previous page"
          variant="pagePrev"
          leftIcon={<ChevronLeftIcon />}
          isDisabled={pageIndex === 0}
          onClick={handlePreviousPage}
        >
          Prev
        </Button>
        <ManualPageSelect
          page={pageIndex + 1}
          totalPages={pageCount}
          onPageSelect={(p) => onChangePageIndex(p - 1)}
          isDisabled={pageCount <= 1}
        />
        <Button
          aria-label="go to next page"
          variant="pageNext"
          rightIcon={<ChevronRightIcon />}
          isDisabled={pageIndex === pageCount - 1}
          onClick={handleNextPage}
        >
          Next
        </Button>
      </Flex>
    </Flex>
  );
};
