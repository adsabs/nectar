import { IDocsEntity } from '@nectar/api';
import Link from 'next/link';
import React from 'react';

interface IItemProps {
  doc: IDocsEntity;
  index: number;
}

export const Item = ({ doc, index }: IItemProps): React.ReactElement => {
  const { bibcode = '', pubdate = '', title = '', author = [] } = doc;

  return (
    <div className="flex border p-1 rounded-lg bg-white">
      <div className="hidden md:flex items-center justify-center mr-3">
        {index}
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex justify-between">
          <Link href={`/abs/${bibcode}`}>
            <a className="text-xs hover:underline">{bibcode}</a>
          </Link>
          <div className="text-xs">{pubdate}</div>
        </div>
        <Link href={`/abs/${bibcode}`}>
          <a className="text-blue-700 text-lg hover:underline">
            <h3>{title}</h3>
          </a>
        </Link>
        <div className="text-xs">{author.slice(0, 3).join('; ')}</div>
      </div>
    </div>
  );
};
