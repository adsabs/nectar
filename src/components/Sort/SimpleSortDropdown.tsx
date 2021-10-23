import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import qs from 'qs';
import { ReactElement } from 'react';
import { sortValues } from './model';

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
    domId: `sort-${id}`,
    label: text,
    path: `/search?${qs.stringify({ q: query, sort: `${id} ${dir}`, p: page })}`,
  }));

  return (
    <>
      <SimpleLinkDropdown
        items={sortItems}
        selected={sort}
        label={sortValues.find((v) => v.id === sort).text}
        aria-label="Sort by"
      />
      <Link
        href={{ pathname: '/search', query: { q: query, sort: `${sort} ${dir === 'desc' ? 'asc' : 'desc'}`, p: page } }}
      >
        <a>
          {dir === 'asc' ? (
            <SortAscendingIcon
              className="inline-block p-2 w-10 h-10 border border-gray-400 rounded-md"
              aria-label="Ascending"
            />
          ) : (
            <SortDescendingIcon
              className="inline-block p-2 w-10 h-10 border border-gray-400 rounded-md"
              aria-label="Descending"
            />
          )}
        </a>
      </Link>
    </>
  );
};
