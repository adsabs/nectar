import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import React, { useRef } from 'react';
import { sortValues } from './model';
export interface ISortProps {
  sort?: SolrSort;
  onChange?: (sort: SolrSort[]) => void;
}

export const Sort = (props: ISortProps): React.ReactElement => {
  const { sort, onChange } = props;
  const firstRender = useRef(true);
  const [selected, setSelected] = React.useState<
    [SolrSortField, SolrSortDirection]
  >(['date', 'desc']);
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

  const handleSortDirectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const val = e.currentTarget.value as SolrSortDirection;
    setSelected([selected[0], val]);
  };

  const [sortValue, sortDirection] = selected;
  return (
    <div>
      <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
        Sort
      </label>
      <div className="flex">
        <select
          name="sort"
          id="sort"
          onChange={handleSortChange}
          value={sortValue}
        >
          {sortValues.map(({ id, text }) => (
            <option value={id} key={id}>
              {text}
            </option>
          ))}
        </select>
        <select
          name="sortDirection"
          id="sortDirection"
          onChange={handleSortDirectionChange}
          value={sortDirection}
        >
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
      </div>
    </div>
  );
};
