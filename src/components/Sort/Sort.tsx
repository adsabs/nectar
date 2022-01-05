import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
import { isBrowser } from '@utils';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { sortValues } from './model';
import { IconButton } from '@chakra-ui/button';
import { Box, HStack } from '@chakra-ui/layout';
import { Input } from '@chakra-ui/input';
import { Select as ChakraSelect } from '@chakra-ui/react';
import { Select, SortSelectorStyle } from '@components';

export interface ISortProps {
  name?: string;
  sort?: SolrSort[];
  hideLabel?: boolean;
  onChange?: (sort: SolrSort[]) => void;
  leftMargin?: string; // css selector
  rightMargin?: string;
}

interface SortOptionType {
  id: string;
  value: string;
  label: string;
}

export const Sort = (props: ISortProps): ReactElement => {
  const { sort: initialSort = ['date desc'], onChange, name = 'sort', hideLabel = false } = props;
  const [sort, ...additionalSorts] = initialSort;
  const firstRender = useRef(true);
  const [selected, setSelected] = useState<[SolrSortField, SolrSortDirection]>(['date', 'desc']);

  useEffect(() => {
    if (sort) {
      // split the incoming sort to conform to tuple style
      const [val, dir] = sort.split(' ') as [SolrSortField, SolrSortDirection];
      setSelected([val, dir]);
    }
  }, [sort]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (typeof onChange === 'function') {
      onChange([selected.join(' ') as SolrSort, ...additionalSorts]);
    }
  }, [selected, onChange]);

  const sortItems: SortOptionType[] = sortValues.map(({ id, text }) => ({
    id: id,
    value: id,
    label: text,
  }));

  const selectedSortItem = useMemo(() => {
    return sortItems.find((item) => item.id === selected[0]);
  }, [selected]);

  const handleSortChange = (sortItem: SolrSortField) => {
    setSelected([sortItem, selected[1]]);
  };

  const handleSortDirectionChange = (id: string) => {
    const val = id as SolrSortDirection;
    setSelected([selected[0], val]);
  };

  const getSortsAsString = () => {
    return [selected.join(' '), ...additionalSorts].join(',');
  };

  // non-js initially rendered on the server, will be swapped out for the full-featured one below when it hits client
  if (!isBrowser()) {
    return (
      <HStack spacing={0}>
        <ChakraSelect id="sort" name="sort" defaultValue={sort}>
          {sortItems.map((item) => (
            <span key={item.label}>
              <option value={`${item.id} asc`}>{item.label} - Asc</option>
              <option value={`${item.id} desc`}>{item.label} - Desc</option>
            </span>
          ))}
        </ChakraSelect>
      </HStack>
    );
  }

  return (
    <HStack spacing={0}>
      <Box width="250px">
        <Select value={selectedSortItem} options={sortItems} styles={SortSelectorStyle} onChange={handleSortChange} />
      </Box>
      {selected[1] === 'asc' ? (
        <IconButton
          variant="outline"
          onClick={() => handleSortDirectionChange('desc')}
          icon={<SortAscendingIcon width="20px" />}
          aria-label="Sort ascending"
          borderLeftRadius="0"
          borderRightRadius="2px"
          size="md"
          colorScheme="gray"
        ></IconButton>
      ) : (
        <IconButton
          variant="outline"
          onClick={() => handleSortDirectionChange('asc')}
          icon={<SortDescendingIcon width="20px" />}
          aria-label="Sort descending"
          borderLeftRadius="0"
          borderRightRadius="2px"
          size="md"
          colorScheme="gray"
        ></IconButton>
      )}

      <Input type="hidden" name={name} value={getSortsAsString()} />
    </HStack>
  );
};
