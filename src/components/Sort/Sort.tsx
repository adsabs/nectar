import { SolrSort, SolrSortDirection, SolrSortField } from '@api';
import { DropdownList, SelectorLabel } from '@components/Dropdown';
import clsx from 'clsx';
import { sv } from 'date-fns/locale';
import React, { useRef } from 'react';
import { sortValues } from './model';
export interface ISortProps {
  name?: string;
  sort?: SolrSort[];
  hideLabel?: boolean;
  onChange?: (sort: SolrSort[]) => void;
}

export const Sort = (props: ISortProps): React.ReactElement => {
  const { sort: initialSort = ['date desc'], onChange, name = 'sort', hideLabel } = props;
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
    label: text
  }));

  const sortDirections = [
    {
      id: 'asc',
      domId: 'sort-asc',
      label: 'asc'
    },
    {
      id: 'desc',
      domId: 'sort-desc',
      label: 'desc'
    }
  ]

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

  const sortSelectorClasses = clsx('text-sm font-md flex items-center justify-between w-52 border border-r-0 border-gray-400 rounded-md rounded-r-none cursor-pointer my-1');

  const dirSelectorClasses = clsx('text-sm font-md flex items-center justify-between w-24 border border-gray-400 rounded-md rounded-l-none cursor-pointer my-1');

  const getLabelNode = () => {
    const sortValue = sortValues.find(sv => selected[0] === sv.id);
    return <SelectorLabel text={sortValue.text} classes={sortSelectorClasses} />
  }

  const getDirectionNode = () => {
    const dir = selected[1];
    return <SelectorLabel text={dir} classes={dirSelectorClasses} />
  }

  return (
    <div>
      {hideLabel && (
        <label htmlFor="sort" className="block text-gray-700 text-sm font-bold">
          Sort
        </label>
      )}
      <div className="flex mx-1 my-1">
        <DropdownList
          label={getLabelNode()}
          items={sortItems}
          onSelect={handleSortChange}
          classes={{
            button: '',
            list: 'w-52 text-sm font-md',
          }}
          offset={[0, 1]}
          useCustomLabel={true}
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
          useCustomLabel={true}
          placement="bottom-start"
          role="listbox"
          ariaLabel="Sort by direction"
        />
        <input type="hidden" name={name} value={getSortsAsString()} />
      </div>
    </div>
  );
};
