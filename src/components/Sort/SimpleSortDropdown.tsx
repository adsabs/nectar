import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { ChevronDownIcon, SortAscendingIcon, SortDescendingIcon } from '@heroicons/react/outline';
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

  const directionLabel = (
    <div
      className="font-md flex items-center justify-between mr-0 p-2 w-56 h-6 text-sm border border-r-0 border-gray-300 rounded-l-md box-content cursor-pointer"
      role="list"
    >
      {sortValues.find((v) => v.id === sort).text} <ChevronDownIcon className="inline w-4 h-4" aria-hidden="true" />
    </div>
  );
  return (
    <div className="flex justify-start my-5">
      <SimpleLinkDropdown
        items={sortItems}
        selected={sort}
        label={directionLabel}
        aria-label="Sort by"
        classes={{
          list: 'w-60 h-auto',
          item: 'text-sm',
        }}
        role={{ label: 'list', item: 'listitem' }}
      />
      <Link
        href={{ pathname: '/search', query: { q: query, sort: `${sort} ${dir === 'desc' ? 'asc' : 'desc'}`, p: page } }}
      >
        <a>
          {dir === 'asc' ? (
            <>
              <span className="sr-only">sort ascending</span>
              <SortAscendingIcon
                className="ml-0 p-2 w-6 h-6 border border-gray-300 rounded-r-md box-content cursor-pointer"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <span className="sr-only">sort descending</span>
              <SortDescendingIcon
                className="ml-0 p-2 w-6 h-6 border border-gray-300 rounded-r-md box-content cursor-pointer"
                aria-hidden="true"
              />
            </>
          )}
        </a>
      </Link>
    </div>
  );
};
