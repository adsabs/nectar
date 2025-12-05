import { Flex, FlexProps, Icon, IconButton, Select } from '@chakra-ui/react';
import { IFacetStoreState } from '@/components/SearchFacet/store/FacetStore';
import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/24/solid';
import { ChangeEventHandler } from 'react';

export const SortControl = ({
  sort,
  onSortChange,
  onlyCount,
  ...flexProps
}: FlexProps & {
  sort: IFacetStoreState['sort'];
  onSortChange: (sort: IFacetStoreState['sort']) => void;
  onlyCount?: boolean;
}) => {
  const [value, dir] = sort;
  const isIndexSort = value === 'index';
  const isDesc = dir === 'desc';

  const handleSortChange: ChangeEventHandler<HTMLSelectElement> = (ev) => {
    const sortVal = ev.currentTarget.value as 'count' | 'index';
    const nextDir = sortVal === 'index' && sortVal !== value ? 'asc' : dir;
    return onSortChange([sortVal, nextDir]);
  };

  const toggleDir = () => {
    onSortChange([value, dir === 'asc' ? 'desc' : 'asc']);
  };

  return (
    <Flex
      direction="row"
      sx={{
        '&:has(select:focus)': {
          boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
        },
      }}
      {...flexProps}
    >
      <Select size="sm" value={value} onChange={handleSortChange} borderRightRadius="none" _focus={{ boxShadow: '' }}>
        <option value="count">Count</option>
        {onlyCount ? null : <option value="index">A-Z</option>}
      </Select>
      <IconButton
        onClick={toggleDir}
        size="sm"
        p="2"
        icon={
          <Icon
            as={
              // In A-Z mode, invert the icon so ascending shows the downward bars (A..Z) to reduce confusion
              isIndexSort
                ? isDesc
                  ? BarsArrowUpIcon
                  : BarsArrowDownIcon
                : isDesc
                ? BarsArrowDownIcon
                : BarsArrowUpIcon
            }
            fontSize="xl"
          />
        }
        colorScheme="gray"
        borderLeftRadius="none"
        aria-label={dir === 'asc' ? 'Sort descending' : 'Sort ascending'}
      />
    </Flex>
  );
};
