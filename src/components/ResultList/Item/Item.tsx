import { IDocsEntity } from '@api';
import { useStore } from '@store';
import { getFomattedNumericPubdate } from '@utils';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChangeEvent, ReactElement, useCallback } from 'react';
import { IAbstractPreviewProps } from './AbstractPreview';
import { ItemResourceDropdowns } from './ItemResourceDropdowns';

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
  const { doc, index, hideCheckbox = false, hideActions = false, useNormCite } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], bibstem = [], author_count } = doc;

  const formattedPubDate = getFomattedNumericPubdate(pubdate);
  const [formattedBibstem] = bibstem;

  const checkBgClass = clsx('bg-gray-100', 'flex items-center justify-center mr-3 px-2 rounded-bl-md rounded-tl-md');

  const indexClass = clsx('hidden items-center justify-center mr-3 md:flex');

  // citations
  const cite = useNormCite ? (
    typeof doc.citation_count_norm === 'number' && doc.citation_count_norm > 0 ? (
      <Link href={`/abs/[id]/citations`} as={`/abs/${bibcode}/citations`}>
        <a className="link">
          <span>cited(n): {doc.citation_count_norm}</span>
        </a>
      </Link>
    ) : null
  ) : typeof doc.citation_count === 'number' && doc.citation_count > 0 ? (
    <Link href={`/abs/[id]/citations`} as={`/abs/${bibcode}/citations`}>
      <a className="link">
        <span>cited: {doc.citation_count}</span>
      </a>
    </Link>
  ) : null;

  return (
    <article className="flex bg-white border rounded-md shadow" aria-labelledby={`result-${bibcode}`}>
      <div className={checkBgClass}>
        <div className={indexClass}>{index.toLocaleString()}</div>
        {hideCheckbox ? null : <ItemCheckbox index={index} bibcode={bibcode} title={title} />}
      </div>
      <div className="flex flex-col mb-1 mr-3 w-full">
        <div className="flex flex-row justify-between pr-2 pt-1">
          <Link href={`/abs/[id]/abstract`} as={`/abs/${bibcode}/abstract`}>
            <a className="pt-1 text-blue-700 hover:underline">
              <h3
                className="text-lg leading-6"
                id={`result-${bibcode}`}
                dangerouslySetInnerHTML={{ __html: title[0] }}
              ></h3>
            </a>
          </Link>
          <div className="flex items-start ml-2">{hideActions ? null : <ItemResourceDropdowns doc={doc} />}</div>
        </div>
        <div className="flex flex-col">
          {author.length > 0 && (
            <div className="text-sm">
              {author.join('; ')}
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
          <AbstractPreview bibcode={bibcode} />
        </div>
      </div>
    </article>
  );
};

const ItemCheckbox = ({ index, bibcode, title }: { index: number; bibcode: string; title: string[] }) => {
  const [selectDoc, unSelectDoc] = useStore((state) => [state.selectDoc, state.unSelectDoc]);

  // memoize the isSelected callback on bibcode
  const isChecked = useStore(useCallback((state) => state.isDocSelected(bibcode), [bibcode]));

  // on select, update the local state and appState
  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    checked ? selectDoc(bibcode) : unSelectDoc(bibcode);
  };

  return (
    <input
      type="checkbox"
      name={`result-checkbox-${index}`}
      id={`result-checkbox-${index}`}
      onChange={handleSelect}
      checked={isChecked}
      aria-label={`${isChecked ? 'De-select' : 'Select'} item ${title[0]}`}
    />
  );
};
