import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Flex, FlexProps, HStack, Icon, IconButton, Select } from '@chakra-ui/react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';
import { Table } from '@tanstack/react-table';
import { useCallback } from 'react';

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
      <HStack spacing="1" flex="1" justifyContent="flex-end">
        <IconButton
          aria-label="go to first page"
          variant="outline"
          colorScheme="gray"
          icon={<Icon as={ChevronDoubleLeftIcon} />}
          isDisabled={!table.getCanPreviousPage()}
          onClick={() => table.setPageIndex(0)}
        />
        <IconButton
          aria-label="go to previous page"
          variant="outline"
          colorScheme="gray"
          icon={<Icon as={ChevronLeftIcon} />}
          isDisabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        />
        <IconButton
          aria-label="go to next page"
          variant="outline"
          colorScheme="gray"
          icon={<Icon as={ChevronRightIcon} />}
          isDisabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        />

        <IconButton
          aria-label="go to last page"
          variant="outline"
          colorScheme="gray"
          icon={<Icon as={ChevronDoubleRightIcon} />}
          isDisabled={!table.getCanNextPage()}
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        />
      </HStack>
    </Flex>
  );
};
