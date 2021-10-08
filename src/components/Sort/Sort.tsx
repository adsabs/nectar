import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { DropdownList, SelectorLabel } from '@components/Dropdown';
import { isBrowser } from '@utils';
import clsx from 'clsx';
import React, { useRef } from 'react';
import { sortValues } from './model';
export interface ISortProps {
  name?: string;
  sort?: SolrSort[];
  hideLabel?: boolean;
  onChange?: (sort: SolrSort[]) => void;
  leftMargin?: string; // css selector
  rightMargin?: string;
}

export const Sort = (props: ISortProps): React.ReactElement => {
  const {
    sort: initialSort = ['date desc'],
    onChange,
    name = 'sort',
    hideLabel,
    leftMargin = 'ml-0',
    rightMargin = 'mr-0',
  } = props;
  const [sort, ...additionalSorts] = initialSort;
  const firstRender = useRef(true);
  const [selected, setSelected] = React.useState<[SolrSortField, SolrSortDirection]>(['date', 'desc']);

  React.useEffect(() => {
    if (sort) {
      // split the incoming sort to conform to tuple style
      const [val, dir] = sort.split(' ') as [SolrSortField, SolrSortDirection];
      setSelected([val, dir]);
    }
  }, [sort]);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (typeof onChange === 'function') {
      onChange([selected.join(' ') as SolrSort, ...additionalSorts]);
    }
  }, [selected, onChange]);

  const sortItems = sortValues.map(({ id, text }) => ({
    id: id,
    domId: `sort-${id}`,
    label: text,
  }));

  const sortDirections = [
    {
      id: 'asc',
      domId: 'sort-asc',
      label: 'asc',
    },
    {
      id: 'desc',
      domId: 'sort-desc',
      label: 'desc',
    },
  ];

  const handleSortChange = (id: string) => {
    const val = id as SolrSortField;
    setSelected([val, selected[1]]);
  };

  const handleSortDirectionChange = (id: string) => {
    const val = id as SolrSortDirection;
    setSelected([selected[0], val]);
  };

  const getSortsAsString = () => {
    return [selected.join(' '), ...additionalSorts].join(',');
  };

  const sortSelectorClasses = clsx(
    leftMargin,
    'font-md flex items-center justify-between my-1 w-52 h-10 text-sm border border-r-0 border-gray-300 rounded-md rounded-r-none cursor-pointer',
  );

  const dirSelectorClasses = clsx(
    rightMargin,
    'font-md flex items-center justify-between my-1 w-24 h-10 text-sm border border-gray-300 rounded-l-none rounded-md cursor-pointer',
  );

  const getLabelNode = () => {
    const sortValue = sortValues.find((sv) => selected[0] === sv.id);
    return <SelectorLabel text={sortValue.text} classes={sortSelectorClasses} />;
  };

  const getDirectionNode = () => {
    const dir = selected[1];
    return <SelectorLabel text={dir} classes={dirSelectorClasses} />;
  };

  // non-js initially rendered on the server, will be swapped out for the full-featured one below when it hits client
  if (!isBrowser()) {
    return (
      <div className="my-1">
        <label htmlFor="sort" className="block text-gray-700 text-sm font-bold sr-only">
          Sort
        </label>
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
      </div>
    );
  }

  return (
    <div>
      {hideLabel && (
        <label htmlFor="sort" className="block text-gray-700 text-sm font-bold">
          Sort
        </label>
      )}
      <div className="flex my-1">
        <DropdownList
          label={getLabelNode()}
          items={sortItems}
          onSelect={handleSortChange}
          classes={{
            button: '',
            list: 'w-52 text-sm font-md',
          }}
          offset={[0, 1]}
          placement="bottom-start"
          role="listbox"
          ariaLabel="Sort by"
        />
        <DropdownList
          label={getDirectionNode()}
          items={sortDirections}
          onSelect={handleSortDirectionChange}
          classes={{
            button: '',
            list: 'w-24 text-sm font-md',
          }}
          offset={[0, 1]}
          placement="bottom-start"
          role="listbox"
          ariaLabel="Sort by direction"
        />
        <input type="hidden" name={name} value={getSortsAsString()} />
      </div>
    </div>
  );
};
