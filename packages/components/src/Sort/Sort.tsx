import { SolrSort } from '@nectar/api';
import React from 'react';
import { sortValues } from './model';
export interface ISortProps {
  sort?: SolrSort;
  onChange: (sort: SolrSort[]) => void;
}

export const Sort = (props: ISortProps): React.ReactElement => {
  const { sort, onChange } = props;
  const [selected, setSelected] = React.useState<SolrSort>(['date', 'desc']);
  React.useEffect(() => {
    if (sort) {
      setSelected(sort);
    }
  }, [sort]);

  React.useEffect(() => {
    if (typeof onChange === 'function') {
      onChange([selected]);
    }
  }, [selected]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.currentTarget.value as SolrSort[0];
    setSelected([val, selected[1]]);
  };

  const handleSortDirectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const val: SolrSort[1] = e.currentTarget.value as SolrSort[1];
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
