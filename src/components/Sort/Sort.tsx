import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
import { isBrowser } from '@utils';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { sortValues } from './model';
import Select, { OptionProps, StylesConfig } from 'react-select';
import { CSSObject } from '@emotion/react';
import { IconButton } from '@chakra-ui/button';
import { Box, HStack } from '@chakra-ui/layout';
import { Input } from '@chakra-ui/input';

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

  const handleSortChange = (sortItem: SortOptionType) => {
    const val = sortItem.id as SolrSortField;
    setSelected([val, selected[1]]);
  };

  const handleSortDirectionChange = (id: string) => {
    const val = id as SolrSortDirection;
    setSelected([selected[0], val]);
  };

  const getSortsAsString = () => {
    return [selected.join(' '), ...additionalSorts].join(',');
  };

  const customStyles: StylesConfig = {
    control: (provided: CSSObject) => ({
      ...provided,
      height: '2.85em',
      borderRadius: '2px 0 0 2px',
      borderRightWidth: '0',
    }),
    indicatorSeparator: () => ({
      isDisabled: true,
    }),
    container: (provided: CSSObject) => ({
      ...provided,
    }),
    option: (provided: CSSObject, state: OptionProps) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
      color: 'var(--chakra-colors-gray-700)',
    }),
  };

  // non-js initially rendered on the server, will be swapped out for the full-featured one below when it hits client
  if (!isBrowser()) {
    return (
      <HStack spacing={0}>
        <select
          id="sort"
          name="sort"
          className="block mt-1 pl-3 pr-10 py-2 w-full text-base border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
          defaultValue={sort}
        >
          {sortItems.map((item) => (
            <span key={item.label}>
              <option value={`${item.id} asc`}>{item.label} asc</option>
              <option value={`${item.id} desc`}>{item.label} desc</option>
            </span>
          ))}
        </select>
      </HStack>
    );
  }

  return (
    <HStack spacing={0}>
      <Box width="250px" fontSize="sm">
        <Select
          value={selectedSortItem}
          options={sortItems}
          isSearchable={false}
          styles={customStyles}
          onChange={handleSortChange}
        />
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
        ></IconButton>
      )}

      <Input type="hidden" name={name} value={getSortsAsString()} />
    </HStack>
  );
};
