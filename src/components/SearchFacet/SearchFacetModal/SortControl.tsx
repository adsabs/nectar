import { Flex, FlexProps, Icon, IconButton, Select } from '@chakra-ui/react';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/solid';
import { ChangeEventHandler } from 'react';
import { IModalState } from './SearchFacetModalWrapper';

export const SortControl = ({
  sort,
  onSortChange,
  ...flexProps
}: FlexProps & { sort: IModalState['sort']; onSortChange: (sort: IModalState['sort']) => void }) => {
  const [value, dir] = sort;

  const handleSortChange: ChangeEventHandler<HTMLSelectElement> = (ev) => {
    const sortVal = ev.currentTarget.value as 'count' | 'alpha';
    return onSortChange([sortVal, dir]);
  };

  const toggleDir = () => {
    onSortChange([value, dir === 'asc' ? 'desc' : 'asc']);
  };

  return (
    <Flex direction="row" {...flexProps}>
      <Select value={value} onChange={handleSortChange}>
        <option value="count">Count</option>
        <option value="alpha">Alphabetical</option>
      </Select>
      <IconButton
        onClick={toggleDir}
        icon={<Icon as={dir === 'desc' ? SortAscendingIcon : SortDescendingIcon} fontSize="lg" />}
        colorScheme="gray"
        borderLeftRadius="none"
        aria-label="sort asc"
      />
    </Flex>
  );
};
