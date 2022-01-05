import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import NextLink from 'next/link';
import qs from 'qs';
import { ReactElement } from 'react';
import { sortValues } from './model';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline/';
import { Link } from '@chakra-ui/layout';
import { IconButton } from '@chakra-ui/button';

export interface ISimpleSortDropdownProps {
  query: string;
  selected: SolrSort;
  page: number;
}

export const SimpleSortDropdown = (props: ISimpleSortDropdownProps): ReactElement => {
  const { query, selected, page } = props;

  const [sort, dir] = selected.split(' ') as [SolrSortField, SolrSortDirection];

  const sortItems = sortValues.map(({ id, text }) => ({
    id: id,
    label: text,
    path: `/search?${qs.stringify({ q: query, sort: `${id} ${dir}`, p: page })}`,
  }));

  const label = sortValues.find((v) => v.id === sort).text;

  return (
    <div className="flex justify-start my-5">
      <SimpleLinkDropdown items={sortItems} label={label} minWidth="250px" />
      <NextLink
        href={{ pathname: '/search', query: { q: query, sort: `${sort} ${dir === 'desc' ? 'asc' : 'desc'}`, p: page } }}
        passHref
      >
        <Link color="gray.700">
          {dir === 'asc' ? (
            <IconButton
              variant="outline"
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
              icon={<SortDescendingIcon width="20px" />}
              aria-label="Sort descending"
              borderLeftRadius="0"
              borderRightRadius="2px"
              size="md"
              colorScheme="gray"
            ></IconButton>
          )}
        </Link>
      </NextLink>
    </div>
  );
};
