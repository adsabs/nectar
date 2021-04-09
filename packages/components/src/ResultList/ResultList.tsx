import { IDocsEntity } from '@nectar/api';
import React from 'react';
import { Item } from './Item/Item';
import { Skeleton } from './Skeleton';

export interface IResultListProps {
  docs: IDocsEntity[];
  loading: boolean;
}

export const ResultList = (props: IResultListProps): React.ReactElement => {
  const { docs, loading = false, } = props;

  let list;
  if (loading) {
    list = <Skeleton count={10} />;
  } else {
    list = docs.map((doc, index) => (
      <Item
        doc={doc}
        key={doc.id}
        index={index + 1}
      />
    ));
  }

  return <div className="flex flex-col space-y-1">{list}</div>;
};
