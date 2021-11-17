import { IDocsEntity } from '@api';
import { getFomattedNumericPubdate } from '@utils';
import { useMachine } from '@xstate/react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ReactElement } from 'react';
import { IAbstractPreviewProps } from './AbstractPreview';
import { ItemResourceDropdowns } from './ItemResourceDropdowns';
import { itemMachine, ItemMachine } from './machine/item';

const AbstractPreview = dynamic<IAbstractPreviewProps>(
  () => import('./AbstractPreview').then((mod) => mod.AbstractPreview),
  { ssr: false },
);
interface IItemProps {
  doc: IDocsEntity;
  index: number;
  hideCheckbox: boolean;
  hideActions: boolean;
  set?: boolean;
  clear?: boolean;
  onSet?: (check: boolean) => void;
  useNormCite?: boolean;
}

export const Item = (props: IItemProps): ReactElement => {
  const { doc, index, hideCheckbox = false, hideActions = false, set, clear, onSet, useNormCite } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], id, bibstem = [], author_count } = doc;
  const [state, send] = useMachine(itemMachine.withContext({ id }));
  const formattedPubDate = getFomattedNumericPubdate(pubdate);
  const [formattedBibstem] = bibstem;

  if ((set && state.matches('unselected')) || (clear && state.matches('selected'))) {
    send({ type: ItemMachine.TransitionTypes.TOGGLE_SELECT });
  }

  const handleSelect = () => {
    state.matches('selected') ? onSet(false) : onSet(true);
    send({ type: ItemMachine.TransitionTypes.TOGGLE_SELECT });
  };

  const checkBgClass = clsx(
    state.matches('selected') ? 'bg-blue-600' : 'bg-gray-100',
    'flex items-center justify-center mr-3 px-2 rounded-bl-md rounded-tl-md',
  );

  const indexClass = clsx(
    state.matches('selected') ? 'text-white' : '',
    'hidden items-center justify-center mr-3 md:flex',
  );

  // citations
  const cite = useNormCite ? (
    typeof doc.citation_count_norm === 'number' && doc.citation_count_norm > 0 ? (
      <Link href={`/abs/${bibcode}/citations`}>
        <a className="link">
          <span>cited(n): {doc.citation_count_norm}</span>
        </a>
      </Link>
    ) : null
  ) : typeof doc.citation_count === 'number' && doc.citation_count > 0 ? (
    <Link href={`/abs/${bibcode}/citations`}>
      <a className="link">
        <span>cited: {doc.citation_count}</span>
      </a>
    </Link>
  ) : null;

  return (
    <article className="flex bg-white border rounded-md shadow" aria-labelledby={`result-${id}`}>
      <div className={checkBgClass}>
        <div className={indexClass}>{index}</div>
        {hideCheckbox ? null : (
          <input
            type="checkbox"
            name={`result-checkbox-${index}`}
            id={`result-checkbox-${index}`}
            onChange={handleSelect}
            checked={state.matches('selected')}
            aria-label={title[0]}
          />
        )}
      </div>
      <div className="flex flex-col mb-1 mr-3 w-full">
        <div className="flex flex-row justify-between pr-2 pt-1">
          <Link href={`/abs/${bibcode}`}>
            <a className="pt-1 text-blue-700 hover:underline">
              <h3 className="text-lg leading-6" id={`result-${id}`} dangerouslySetInnerHTML={{ __html: title[0] }}></h3>
            </a>
          </Link>
          <div className="flex items-start ml-2">{hideActions ? null : <ItemResourceDropdowns doc={doc} />}</div>
        </div>
        <div className="flex flex-col">
          {author.length > 0 && (
            <div className="text-sm">
              {author.slice(0, 10).join('; ')}
              {author_count > 10 && <span className="text-xs italic"> and {author_count - 10} more</span>}
            </div>
          )}
          <div className="flex py-1">
            <span className="text-xs">
              {formattedPubDate}
              {formattedPubDate && formattedBibstem ? <span className="px-2">·</span> : ''}
              {formattedBibstem}
              {cite && (formattedPubDate || formattedBibstem) ? <span className="px-2">·</span> : null}
              {cite}
            </span>
          </div>
          <AbstractPreview id={id} />
        </div>
      </div>
    </article>
  );
};
