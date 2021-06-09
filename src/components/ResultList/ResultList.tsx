import { IDocsEntity } from '@api';
import React from 'react';
import { Item } from './Item/Item';
import { Skeleton } from './Skeleton';

export interface IResultListProps {
  docs: IDocsEntity[];
  hideCheckboxes?: boolean;
  loading?: boolean;
}

export const ResultList = (props: IResultListProps): React.ReactElement => {
  const { docs = [], loading = false, hideCheckboxes = false } = props;

  let list;
  if (loading) {
    list = <Skeleton count={10} />;
  } else {
    list = docs.map((doc, index) => <Item doc={doc} key={doc.id} index={index + 1} hideCheckbox={hideCheckboxes} />);
  }

  return <div className="flex flex-col mt-1 space-y-1">{list}</div>;
};
