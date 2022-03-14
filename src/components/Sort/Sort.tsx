import { SolrSort } from '@api';
import { IconButton } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, HStack } from '@chakra-ui/layout';
import { Select as ChakraSelect } from '@chakra-ui/react';
import { SortSelectorStyle } from '@components';
import { ISelectProps, Select } from '@components/Select';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
import { useIsClient } from '@hooks/useIsClient';
import { normalizeSolrSort } from '@utils';
import { Fragment, MouseEventHandler, ReactElement, useCallback, useMemo } from 'react';
import { sortValues } from './model';

export interface ISortProps {
  name?: string;
  sort?: SolrSort | SolrSort[];
  hideLabel?: boolean;
  onChange?: (sort: SolrSort[]) => void;
  leftMargin?: string; // css selector
  rightMargin?: string;
}

/**
 * Sort Component
 *
 * Expects to be controlled (i.e. using sort and onChange to control value/updating)
 */
export const Sort = (props: ISortProps): ReactElement => {
  const { sort = ['date desc'], onChange, name = 'sort' } = props;

  // normalize incoming sort
  const allSorts = useMemo(() => normalizeSolrSort(sort), [sort]);

  // split first sort, the rest are just along for the ride
  const [selected, direction] = useMemo(() => allSorts[0].split(/\W+/), [allSorts]);

  // fire onChange handler for direction change
  const handleDirectionChange: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      onChange([`${selected} ${e.currentTarget.dataset['direction']}` as SolrSort, ...allSorts.slice(1)]);
    },
    [selected, onChange],
  );

  // fire onChange handler for selection change
  const handleSelectionChange = useCallback(
    (value: string) => onChange([`${value} ${direction}` as SolrSort, ...allSorts.slice(1)]),
    [direction, onChange],
  );

  // non-js initially rendered on the server, will be swapped out
  // for the full-featured one below when it hits client
  const isClient = useIsClient();
  if (!isClient) {
    return (
      <ChakraSelect id="sort" name="sort" defaultValue={selected}>
        {sortOptions.map((item) => (
          <Fragment key={item.label}>
            <option value={`${item.id} asc`}>{item.label} - Asc</option>
            <option value={`${item.id} desc`}>{item.label} - Desc</option>
          </Fragment>
        ))}
      </ChakraSelect>
    );
  }

  return (
    <HStack spacing={0}>
      <Box width="250px">
        <SortSelect sort={selected} onChange={handleSelectionChange} />
      </Box>
      {direction === 'asc' ? (
        <IconButton
          variant="outline"
          onClick={handleDirectionChange}
          data-direction="desc"
          icon={<SortAscendingIcon width="20px" />}
          aria-label="Sort ascending"
          borderLeftRadius="0"
          borderRightRadius="2px"
          size="md"
          colorScheme="gray"
        />
      ) : (
        <IconButton
          variant="outline"
          onClick={handleDirectionChange}
          data-direction="asc"
          icon={<SortDescendingIcon width="20px" />}
          aria-label="Sort descending"
          borderLeftRadius="0"
          borderRightRadius="2px"
          size="md"
          colorScheme="gray"
        />
      )}

      <Input type="hidden" name={name} value={allSorts.join(',')} />
    </HStack>
  );
};

interface SortOptionType {
  id: string;
  value: string;
  label: string;
}

const sortOptions: SortOptionType[] = sortValues.map((v) => ({ id: v.id, value: v.id, label: v.text }));

// Sort Select component
const SortSelect = ({ sort, onChange }: { sort: string; onChange: ISelectProps<string>['onChange'] }) => {
  const selected = sortOptions.find((o) => o.id === sort) ?? sortOptions[0];
  return <Select value={selected} options={sortOptions} styles={SortSelectorStyle} onChange={onChange} />;
};
