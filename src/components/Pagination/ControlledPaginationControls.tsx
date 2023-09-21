import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Flex, FlexProps, HStack, Icon, IconButton, Select } from '@chakra-ui/react';
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid';
import { useCallback } from 'react';

export interface IPaginationControlsProps extends FlexProps {
  entries: number;
  pageIndex: number;
  pageSize: number;
  onChangePageSize: (size: number) => void;
  onChangePageIndex: (index: number) => void;
}

export const ControlledPaginationControls = <T extends object>(props: IPaginationControlsProps) => {
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
      <Flex flex="1">{getPaginationString()}</Flex>
      <Flex justifyContent="center">
        <Select
          defaultValue={10}
          onChange={(e) => onChangePageSize(e.target.value ? Number(e.target.value) : 10)}
          size="sm"
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
          isDisabled={pageIndex === 0}
          onClick={() => onChangePageIndex(0)}
        />
        <IconButton
          aria-label="go to previous page"
          variant="outline"
          colorScheme="gray"
          icon={<Icon as={ChevronLeftIcon} />}
          isDisabled={pageIndex === 0}
          onClick={handlePreviousPage}
        />
        <IconButton
          aria-label="go to next page"
          variant="outline"
          colorScheme="gray"
          icon={<Icon as={ChevronRightIcon} />}
          isDisabled={pageIndex === pageCount - 1}
          onClick={handleNextPage}
        />

        <IconButton
          aria-label="go to last page"
          variant="outline"
          colorScheme="gray"
          icon={<Icon as={ChevronDoubleRightIcon} />}
          isDisabled={pageIndex === pageCount - 1}
          onClick={() => onChangePageIndex(pageCount - 1)}
        />
      </HStack>
    </Flex>
  );
};
