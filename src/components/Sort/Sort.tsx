import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import React, { useRef } from 'react';
import { sortValues } from './model';
export interface ISortProps {
  name?: string;
  sort?: SolrSort;
  hideLabel?: boolean;
  onChange?: (sort: SolrSort[]) => void;
}

export const Sort = (props: ISortProps): React.ReactElement => {
  const { sort, onChange, name = 'sort', hideLabel } = props;
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
      onChange([selected.join(' ') as SolrSort]);
    }
  }, [selected, onChange]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.currentTarget.value as SolrSortField;
    setSelected([val, selected[1]]);
  };

  const handleSortDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.currentTarget.value as SolrSortDirection;
    setSelected([selected[0], val]);
  };

  const [sortValue, sortDirection] = selected;
  return (
    <div>
      {hideLabel && (
        <label htmlFor="sort" className="block text-gray-700 text-sm font-bold">
          Sort
        </label>
      )}
      <div className="flex">
        <select
          id="sort"
          onChange={handleSortChange}
          value={sortValue}
          className="block flex-1 mt-1 pl-3 py-2 w-full text-base border-r-0 border-gray-300 focus:border-indigo-500 rounded-md rounded-r-none focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {sortValues.map(({ id, text }) => (
            <option value={id} key={id}>
              {text}
            </option>
          ))}
        </select>
        <select
          id="sortDirection"
          onChange={handleSortDirectionChange}
          value={sortDirection}
          className="block mt-1 pl-3 py-2 text-base border-gray-300 focus:border-indigo-500 rounded-l-none rounded-md focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
        <input type="hidden" name={name} value={selected.join(' ')} />
      </div>
    </div>
  );
};
