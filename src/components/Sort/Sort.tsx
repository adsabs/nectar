import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { Box, HStack, IconButton, Input } from '@chakra-ui/react';
import { SearchQueryLink, SimpleLinkDropdown } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { ISelectProps, Select } from '@components/Select';
import { APP_DEFAULTS } from '@config';
import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/24/outline';
import { useIsClient } from '@lib/useIsClient';
import { makeSearchParams, normalizeSolrSort, parseQueryFromUrl } from '@utils';
import { useRouter } from 'next/router';
import { Fragment, MouseEventHandler, ReactElement, useCallback, useMemo } from 'react';
import { sortValues } from './model';

/**
 *
 *
 */
export interface ISortProps {
  name?: string;
  sort?: SolrSort | SolrSort[];
  hideLabel?: boolean;
  fullWidth?: boolean;
  onChange?: (sort: SolrSort[]) => void;
  leftMargin?: string;
  rightMargin?: string;
  innerSelectProps?: Partial<ISelectProps<SortOptionType>>;

  /**
   * If true will use the native dropdown when no JavaScript,
   * otherwise will use one with same look and feel as JS supported one
   */
  useNativeWhenNoJs?: boolean;
}

/**
 * Sort Component
 *
 * Expects to be controlled (i.e. using sort and onChange to control value/updating)
 */
export const Sort = (props: ISortProps): ReactElement => {
  const {
    sort = APP_DEFAULTS.SORT,
    onChange,
    name = 'sort',
    useNativeWhenNoJs = false,
    hideLabel = true,
    fullWidth = false,
    innerSelectProps,
  } = props;

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

  const sortContainerWidth = fullWidth ? 'full' : '250px';

  return (
    <HStack spacing={0} data-testid="sort" alignItems="flex-end">
      <Box width={sortContainerWidth}>
        <SortSelect
          hideLabel={hideLabel}
          sort={selected}
          onChange={handleSelectionChange}
          innerSelectProps={innerSelectProps}
        />
      </Box>
      {direction === 'asc' ? (
        <IconButton
          variant="outline"
          onClick={handleDirectionChange}
          data-direction="desc"
          icon={<BarsArrowUpIcon width="20px" />}
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
          icon={<BarsArrowDownIcon width="20px" />}
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
  id: SolrSortField;
  value: string;
  label: string;
}

export const sortOptions: SortOptionType[] = sortValues.map((v) => ({ id: v.id, value: v.id, label: v.text }));

// Sort Select component
const SortSelect = ({
  sort,
  onChange,
  hideLabel,
  innerSelectProps,
}: {
  sort: string;
  onChange: (val: SortOptionType) => void;
  hideLabel: ISortProps['hideLabel'];
  innerSelectProps?: Partial<ISelectProps<SortOptionType>>;
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
      id="sort-select"
      {...innerSelectProps}
    />
  );
};

// non-native type, used in search results
const NoJsSort = (): ReactElement => {
  const router = useRouter();
  const query = parseQueryFromUrl(router.asPath);
  const [sortby, dir] = query.sort[0].split(' ') as [SolrSortField, SolrSortDirection];

  const getToggledDir = (dir: SolrSortDirection) => {
    return dir === 'asc' ? 'desc' : 'asc';
  };

  const options: ItemType[] = [];
  sortOptions.forEach((sort) => {
    options.push({
      id: `${sort.id}`,
      label: `${sort.label}`,
      path: { search: makeSearchParams({ q: '*:*', ...router.query, sort: [`${sort.id} ${dir}`], p: 1 }) },
    });
  });

  return (
    <HStack spacing={0}>
      <SimpleLinkDropdown
        items={options}
        label={sortOptions.find((o) => o.id === sortby).label}
        minListWidth="300px"
        minLabelWidth="300px"
      />
      <SearchQueryLink params={{ q: '*:*', ...router.query, p: 1, sort: [`${sortby} ${getToggledDir(dir)}`] }}>
        <>
          {dir === 'desc' ? (
            <IconButton
              variant="outline"
              icon={<BarsArrowDownIcon width="20px" />}
              aria-label="Sort descending"
              borderLeftRadius="0"
              borderRightRadius="2px"
              size="md"
              colorScheme="gray"
            />
          ) : (
            <IconButton
              variant="outline"
              icon={<BarsArrowUpIcon width="20px" />}
              aria-label="Sort ascending"
              borderLeftRadius="0"
              borderRightRadius="2px"
              size="md"
              colorScheme="gray"
            />
          )}
        </>
      </SearchQueryLink>
    </HStack>
  );
};

// native type, used by classic form
const NoJsNativeSort = ({ name }: { name: string }): ReactElement => {
  return (
    <select id="sort" name={name} defaultValue="score desc">
      {sortOptions.map((item) => (
        <Fragment key={item.label}>
          <option value={`${item.id} asc`}>{item.label} - Asc</option>
          <option value={`${item.id} desc`}>{item.label} - Desc</option>
        </Fragment>
      ))}
    </select>
  );
};
