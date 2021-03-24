import { IDocsEntity } from '@nectar/api';
import Link from 'next/link';
import React from 'react';

interface IItemProps {
  doc: Partial<IDocsEntity>;
  index: number;
  selected: boolean;
  onSelect: (item: IDocsEntity['id']) => void;
}

export const Item = (props: IItemProps): React.ReactElement => {
  const { doc, index, selected, onSelect } = props;
  const { bibcode = '', pubdate = '', title = '', author = [], id } = doc;

  const handleSelect = () => {
    if (id) {
      onSelect(id);
    }
  };

  return (
    <div className="flex border py-1 px-2 rounded-md bg-white">
      <div className="hidden md:flex items-center justify-center mr-3">
        {index}
      </div>
      <div className="hidden md:flex items-center justify-center mr-3">
        <input
          type="checkbox"
          name={`result-checkbox-${index}`}
          id={`result-checkbox-${index}`}
          onChange={handleSelect}
          checked={selected}
        />
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
