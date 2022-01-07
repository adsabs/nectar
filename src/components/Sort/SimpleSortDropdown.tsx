import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import NextLink from 'next/link';
import qs from 'qs';
import { ReactElement } from 'react';
import { sortValues } from './model';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline/';
import { Flex, Link } from '@chakra-ui/layout';
import { IconButton } from '@chakra-ui/button';
import { SimpleLinkList } from '@components';

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

  const sortDirs = [
    { id: 'asc', label: 'Ascending', path: `/search?${qs.stringify({ q: query, sort: `${sort} asc`, p: page })}` },
    { id: 'desc', label: 'Descending', path: `/search?${qs.stringify({ q: query, sort: `${sort} desc`, p: page })}` },
  ];

  const label = sortValues.find((v) => v.id === sort).text;

  return (
    // <div className="flex justify-start my-5">
    //   <SimpleLinkDropdown items={sortItems} label={label} minLabelWidth="250px" minListWidth="250px" />
    //   <NextLink
    //     href={{ pathname: '/search', query: { q: query, sort: `${sort} ${dir === 'desc' ? 'asc' : 'desc'}`, p: page } }}
    //     passHref
    //   >
    //     <Link color="gray.700">
    //       {dir === 'asc' ? (
    //         <IconButton
    //           variant="outline"
    //           icon={<SortAscendingIcon width="20px" />}
    //           aria-label="Sort ascending"
    //           borderLeftRadius="0"
    //           borderRightRadius="2px"
    //           size="md"
    //           colorScheme="gray"
    //         ></IconButton>
    //       ) : (
    //         <IconButton
    //           variant="outline"
    //           icon={<SortDescendingIcon width="20px" />}
    //           aria-label="Sort descending"
    //           borderLeftRadius="0"
    //           borderRightRadius="2px"
    //           size="md"
    //           colorScheme="gray"
    //         ></IconButton>
    //       )}
    //     </Link>
    //   </NextLink>
    // </div>
    <Flex direction="column">
      <SimpleLinkList items={sortItems} label="Sort by" asRow showLabel selected={sort} />
      <SimpleLinkList items={sortDirs} label="Sort direction" asRow showLabel selected={dir} />
    </Flex>
  );
};
