import { Box, HStack, IconButton, Input } from '@chakra-ui/react';

import { ItemType } from '@/components/Dropdown/types';
import { ISelectProps, Select } from '@/components/Select';
import { BarsArrowDownIcon, BarsArrowUpIcon } from '@heroicons/react/24/outline';
import { useIsClient } from '@/lib/useIsClient';
import { useRouter } from 'next/router';
import { Fragment, MouseEventHandler, ReactElement, useCallback, useMemo } from 'react';
import { SimpleLinkDropdown } from '@/components/Dropdown';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import { SolrSort, SolrSortField, SortDirection, SortField, SortType } from '@/api/models';

export interface ISortProps<S extends SortType, F extends SortField> {
  sort: S;
  options: SortOptionType<F>[];
  name?: string;
  hiddenInput?: { name: string; value: string };
  hideLabel?: boolean;
  fullWidth?: boolean;
  onChange?: (sort: S) => void;
  leftMargin?: string;
  rightMargin?: string;
  innerSelectProps?: Partial<ISelectProps<SortOptionType<F>>>;

  /**
   * If true will use the native dropdown when no JavaScript,
   * otherwise will use one with same look and feel as JS supported one
   */
  useNativeWhenNoJs?: boolean;

  disableWhenNoJs?: boolean;
}

/**
 * Sort Component
 *
 * Expects to be controlled (i.e. using sort and onChange to control value/updating)
 */
export const Sort = <S extends SortType = SolrSort, F extends SortField = SolrSortField>(
  props: ISortProps<S, F>,
): ReactElement => {
  const {
    sort,
    onChange,
    options,
    name = 'sort',
    hiddenInput,
    useNativeWhenNoJs = false,
    disableWhenNoJs = false,
    hideLabel = true,
    fullWidth = false,
    innerSelectProps,
  } = props;

  // split first sort, the rest are just along for the ride
  const [selected, direction] = useMemo(() => sort.split(/\W+/), [sort]);

  // fire onChange handler for direction change
  const handleDirectionChange: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      onChange(`${selected} ${e.currentTarget.dataset['direction']}` as S);
    },
    [selected, onChange],
  );

  // fire onChange handler for selection change
  const handleSelectionChange = useCallback(
    (selection: SortOptionType<F>) => onChange(`${selection.value} ${direction}` as S),
    [direction, onChange],
  );

  // non-js initially rendered on the server, will be swapped out
  // for the full-featured one below when it hits client
  const isClient = useIsClient();
  if (!isClient && !disableWhenNoJs) {
    return (
      <>
        {useNativeWhenNoJs ? <NoJsNativeSort name={name} sortOptions={options} /> : <NoJsSort sortOptions={options} />}
      </>
    );
  }

  const sortContainerWidth = fullWidth ? 'full' : '250px';

  return (
    <HStack spacing={0} data-testid="sort" alignItems="flex-end">
      <Box width={sortContainerWidth}>
        <SortSelect
          hideLabel={hideLabel}
          sortOptions={options}
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

      {hiddenInput && <Input type="hidden" name={hiddenInput.name} value={hiddenInput.value} />}
    </HStack>
  );
};

interface SortOptionType<F extends SortField> {
  id: F;
  value: string;
  label: string;
}

// Sort Select component
const SortSelect = <S extends SortType, F extends SortField>({
  sort,
  sortOptions,
  onChange,
  hideLabel,
  innerSelectProps,
}: {
  sort: string;
  sortOptions: SortOptionType<F>[];
  onChange: (val: SortOptionType<F>) => void;
  hideLabel: ISortProps<S, F>['hideLabel'];
  innerSelectProps?: Partial<ISelectProps<SortOptionType<F>>>;
}) => {
  const selected = sortOptions.find((o) => o.id === sort) ?? sortOptions[0];
  return (
    <Select<SortOptionType<F>>
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
const NoJsSort = <F extends SortField>({ sortOptions }: { sortOptions: SortOptionType<F>[] }): ReactElement => {
  const router = useRouter();
  const query = parseQueryFromUrl(router.asPath);
  const [sortby, dir] = query.sort[0].split(' ') as [SolrSortField, SortDirection];

  const getToggledDir = (dir: SortDirection) => {
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
const NoJsNativeSort = <F extends SortField>({
  name,
  sortOptions,
}: {
  name: string;
  sortOptions: SortOptionType<F>[];
}): ReactElement => {
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
