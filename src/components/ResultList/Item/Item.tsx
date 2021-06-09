import { IDocsEntity } from '@api';
import { useMachine } from '@xstate/react';
import Link from 'next/link';
import React from 'react';
import { AbstractPreview } from './AbstractPreview';
import { itemMachine, ItemMachine } from './machine/item';

interface IItemProps {
  doc: Pick<IDocsEntity, 'id' | 'bibcode'> & Partial<IDocsEntity>;
  index: number;
  hideCheckbox: boolean;
}

export const Item = (props: IItemProps): React.ReactElement => {
  const { doc, index, hideCheckbox = false } = props;
  const { bibcode, pubdate, title = 'Untitled', author = [], id } = doc;
  const [state, send] = useMachine(itemMachine.withContext({ id }), {
    devTools: true,
  });

  const handleSelect = () => {
    send({ type: ItemMachine.TransitionTypes.TOGGLE_SELECT });
  };

  return (
    <div className="flex px-2 py-1 bg-white border rounded-md">
      <div className="hidden items-center justify-center mr-3 md:flex">{index}</div>
      {hideCheckbox ? null : (
        <div className="hidden items-center justify-center mr-3 md:flex">
          <input
            type="checkbox"
            name={`result-checkbox-${index}`}
            id={`result-checkbox-${index}`}
            onChange={handleSelect}
            checked={state.matches('selected')}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <Link href={`/abs/${bibcode}`}>
            <a className="hover:underline text-xs">{bibcode}</a>
          </Link>
          {pubdate && <div className="text-xs">{pubdate}</div>}
        </div>
        <Link href={`/abs/${bibcode}`}>
          <a className="text-blue-700 hover:underline text-lg">
            <h3>{title}</h3>
          </a>
        </Link>
        {author.length > 0 && <div className="text-xs">{author.slice(0, 3).join('; ')}</div>}
        <div className="flex">
          <AbstractPreview id={id} />
        </div>
      </div>
    </div>
  );
};
