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

  console.log('resultlist', docs);

  return (
    <div className="flex flex-col mt-1 space-y-1">
      {loading ? (
        <Skeleton count={10} />
      ) : docs.length > 0 ? (
        docs.map((doc, index) => <Item doc={doc} key={doc.id} index={index + 1} hideCheckbox={hideCheckboxes} />)
      ) : (
        <div className="flex items-center justify-center text-lg">No Results Found</div>
      )}
    </div>
  );
};
