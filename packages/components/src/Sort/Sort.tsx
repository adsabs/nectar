import React, { HTMLAttributes } from 'react';
import { DropdownList } from '../Dropdown';
import type { SortType } from './types';
export interface ISortProps extends HTMLAttributes<HTMLDivElement> {
  sort: SortType
}

export const Sort = ({ sort }: ISortProps): React.ReactElement => {
  const [sortValue, sortDirection] = sort;
  console.log({ sortValue, sortDirection });

  return (
    <DropdownList
      label="click me"
      items={[{id: 'test', label: 'label' }]}
    />
  );
}
