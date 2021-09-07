import { IDocsEntity } from '@api';
import { useMachine } from '@xstate/react';
import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';
import { AbstractPreview } from './AbstractPreview';
import { itemMachine, ItemMachine } from './machine/item';
import { DocumentTextIcon, ViewListIcon, DatabaseIcon } from '@heroicons/react/outline';

interface IItemProps {
  doc: Pick<IDocsEntity, 'id' | 'bibcode'> & Partial<IDocsEntity>;
  index: number;
  hideCheckbox: boolean;
  showAbstract: boolean;
  set?: boolean;
  clear?: boolean;
  onSet: (check: boolean) => void;
}

export const Item = (props: IItemProps): React.ReactElement => {
  const { doc, index, hideCheckbox = false, showAbstract, set, clear, onSet } = props;
  const { bibcode, pubdate, title = 'Untitled', author = [], id, citation } = doc;

  const [state, send] = useMachine(itemMachine.withContext({ id }), {
    devTools: true,
  });

  if ((set && state.matches('unselected')) || (clear && state.matches('selected'))) {
    send({ type: ItemMachine.TransitionTypes.TOGGLE_SELECT });
  }

  const handleSelect = () => {
    state.matches('selected') ? onSet(false) : onSet(true);
    send({ type: ItemMachine.TransitionTypes.TOGGLE_SELECT });
  };

  const checkBgClass = clsx(
    state.matches('selected') ? 'bg-blue-600' : 'bg-gray-100',
    'hidden items-center justify-center mr-3 px-2 rounded-bl-md rounded-tl-md md:flex',
  );

  const indexClass = clsx(
    state.matches('selected') ? 'text-white' : '',
    'hidden items-center justify-center mr-3 md:flex',
  );

  return (
    <article className="flex bg-white border rounded-md shadow" aria-labelledby={`result-${id}`}>
      {hideCheckbox ? null : (
        <div className={checkBgClass}>
          <div className={indexClass}>{index}</div>
          <input
            type="checkbox"
            name={`result-checkbox-${index}`}
            id={`result-checkbox-${index}`}
            onChange={handleSelect}
            checked={state.matches('selected')}
            aria-label={title}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col px-2 py-3">
        <div className="flex justify-between">
          <Link href={`/abs/${bibcode}`}>
            <a className="py-1 hover:underline text-xs">{bibcode}</a>
          </Link>
        </div>
        <Link href={`/abs/${bibcode}`}>
          <a className="text-blue-700 hover:underline">
            <h3 className="text-lg" id={`result-${id}`} dangerouslySetInnerHTML={{ __html: title }}></h3>
          </a>
        </Link>
        {author.length > 0 && <div className="text-s">{author.slice(0, 3).join('; ')}</div>}
        <div className="flex py-1">
          {pubdate && <span className="text-xs">{pubdate}</span>}
          {citation && <span className="text-xs">cite: {citation}</span>}
        </div>
        <div className="flex">
          <AbstractPreview id={id} showAbstract={showAbstract} />
        </div>
      </div>
      <div className="flex items-start p-2">
        <button title="Full text sources" tabIndex={0}>
          <DocumentTextIcon className="default-icon default-link-color" />
        </button>
        <button title="Citations and references" tabIndex={0}>
          <ViewListIcon className="default-icon default-link-color" />
        </button>
        <button title="Data" tabIndex={0}>
          <DatabaseIcon className="default-icon default-link-color" />
        </button>
      </div>
    </article>
  );
};
