import { SolrSort, SolrSortDirection } from '@api';
import { IconButton } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, HStack, Link } from '@chakra-ui/layout';
import { SimpleLinkDropdown } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { Select } from '@components/Select';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
import { useIsClient } from '@hooks/useIsClient';
import { normalizeSolrSort } from '@utils';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, MouseEventHandler, ReactElement, useCallback, useMemo } from 'react';
import { sortValues } from './model';

export interface ISortProps {
  name?: string;
  sort?: SolrSort | SolrSort[];
  hideLabel?: boolean;
  onChange?: (sort: SolrSort[]) => void;
  leftMargin?: string; // css selector
  rightMargin?: string;
  useNativeWhenNoJs?: boolean; // true will use the native dropdown when no JavaScript, otherwise will use one with same look and feel as JS supported one
}

/**
 * Sort Component
 *
 * Expects to be controlled (i.e. using sort and onChange to control value/updating)
 */
export const Sort = (props: ISortProps): ReactElement => {
  const { sort = ['date desc'], onChange, name = 'sort', useNativeWhenNoJs = false, hideLabel = true } = props;

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
    (selection: SortOptionType) => onChange([`${selection.value} ${direction}` as SolrSort, ...allSorts.slice(1)]),
    [direction, onChange],
  );

  // non-js initially rendered on the server, will be swapped out
  // for the full-featured one below when it hits client
  const isClient = useIsClient();
  if (!isClient) {
    return <>{useNativeWhenNoJs ? <NoJsNativeSort name={name} /> : <NoJsSort />}</>;
  }

  return (
    <HStack spacing={0}>
      <Box width="250px">
        <SortSelect hideLabel={hideLabel} sort={selected} onChange={handleSelectionChange} />
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
          data-testid="sort-direction-toggle"
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
          data-testid="sort-direction-toggle"
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

export const sortOptions: SortOptionType[] = sortValues.map((v) => ({ id: v.id, value: v.id, label: v.text }));

// Sort Select component
const SortSelect = ({
  sort,
  onChange,
  hideLabel,
}: {
  sort: string;
  onChange: (val: SortOptionType) => void;
  hideLabel: ISortProps['hideLabel'];
}) => {
  const selected = sortOptions.find((o) => o.id === sort) ?? sortOptions[0];
  return (
    <Select<SortOptionType>
      label="Sort"
      hideLabel={hideLabel}
      value={selected}
      options={sortOptions}
      stylesTheme="sort"
      onChange={onChange}
      data-testid="sort-select"
    />
  );
};

// non-native type, used in search results
const NoJsSort = (): ReactElement => {
  const router = useRouter();

  const sortParam: SolrSort = router.query.sort
    ? typeof router.query.sort === 'string'
      ? (router.query.sort as SolrSort)
      : (router.query.sort[0] as SolrSort)
    : 'date desc';

  const [sortby, dir] = sortParam.split(' ');

  const getToggledDir = (dir: SolrSortDirection) => {
    return dir === 'asc' ? 'desc' : 'asc';
  };

  const options: ItemType[] = [];
  sortOptions.forEach((sort) => {
    options.push({
      id: `${sort.id}`,
      label: `${sort.label}`,
      path: { query: { ...router.query, sort: `${sort.id} ${dir}`, p: 1 } },
    });
  });

  return (
    <HStack spacing={0}>
      <SimpleLinkDropdown items={options} label={sortby} minListWidth="300px" minLabelWidth="300px" />
      <NextLink
        href={{ query: { ...router.query, p: 1, sort: `${sortby} ${getToggledDir(dir as SolrSortDirection)}` } }}
        passHref
      >
        <Link>
          <>
            {dir === 'desc' ? (
              <IconButton
                variant="outline"
                icon={<SortDescendingIcon width="20px" />}
                aria-label="Sort descending"
                borderLeftRadius="0"
                borderRightRadius="2px"
                size="md"
                colorScheme="gray"
              />
            ) : (
              <IconButton
                variant="outline"
                icon={<SortAscendingIcon width="20px" />}
                aria-label="Sort ascending"
                borderLeftRadius="0"
                borderRightRadius="2px"
                size="md"
                colorScheme="gray"
              />
            )}
          </>
        </Link>
      </NextLink>
    </HStack>
  );
};

// native type, used by classic form
const NoJsNativeSort = ({ name }: { name: string }): ReactElement => {
  return (
    <select id="sort" name={name}>
      {sortOptions.map((item) => (
        <Fragment key={item.label}>
          <option value={`${item.id} asc`}>{item.label} - Asc</option>
          <option value={`${item.id} desc`} selected={item.id === 'date'}>
            {item.label} - Desc
          </option>
        </Fragment>
      ))}
    </select>
  );
};
