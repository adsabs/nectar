import { IDocsEntity } from '@nectar/api';
import React from 'react';
import { Item } from './Item';

export interface IResultListProps {
  docs: IDocsEntity[];
}

export const ResultList = ({ docs }: IResultListProps): React.ReactElement => {
  const list = docs.map((doc, index) => (
    <Item doc={doc} key={doc.id} index={index + 1} />
  ));

  return <div className="flex flex-col space-y-1">{list}</div>;
};
