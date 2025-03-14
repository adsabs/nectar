import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Button, Flex, FlexProps, Select } from '@chakra-ui/react';
import { Table } from '@tanstack/react-table';
import { useCallback } from 'react';
import { ManualPageSelect } from './ManualPageSelect';

export interface IPaginationControlsProps<T> extends FlexProps {
  table: Table<T>;
  entries: T[];
}

export const PaginationControls = <T extends object>(props: IPaginationControlsProps<T>) => {
  const { table, entries, ...flexProps } = props;

  const { pageIndex, pageSize } = table.getState().pagination;
  const getPaginationString = useCallback(() => {
    const endIdx = pageIndex * pageSize + pageSize > entries.length ? entries.length : pageIndex * pageSize + pageSize;
    return `Showing ${pageIndex * pageSize + 1} to ${endIdx} of ${entries.length} results`;
  }, [entries.length, pageSize, pageIndex]);

  return (
    <Flex {...flexProps}>
      <Flex flex="1">{getPaginationString()}</Flex>
      <Flex justifyContent="center">
        <Select
          defaultValue={10}
          onChange={(e) => table.setPageSize(e.target.value ? Number(e.target.value) : 10)}
          size="sm"
          display={{ base: 'none', sm: 'block' }}
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
          isDisabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </Button>
        <ManualPageSelect
          page={pageIndex + 1}
          totalPages={table.getPageCount()}
          onPageSelect={(p) => table.setPageIndex(p - 1)}
          isDisabled={entries.length <= pageSize}
        />
        <Button
          aria-label="go to next page"
          variant="pageNext"
          rightIcon={<ChevronRightIcon />}
          isDisabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </Button>
      </Flex>
    </Flex>
  );
};
