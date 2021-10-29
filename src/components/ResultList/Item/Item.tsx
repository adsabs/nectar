import { IDocsEntity } from '@api';
import { processLinkData } from '@components/AbstractSources/linkGenerator';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { ItemType } from '@components/Dropdown/types';
import { DatabaseIcon, DocumentTextIcon, ViewListIcon } from '@heroicons/react/outline';
import { useViewport, Viewport } from '@hooks';
import { getFomattedNumericPubdate } from '@utils';
import { useMachine } from '@xstate/react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { ReactElement } from 'react';
import { IAbstractPreviewProps } from './AbstractPreview';
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
  const { bibcode, pubdate, title = ['Untitled'], author = [], id, citation, bibstem = [], author_count } = doc;
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
    doc.citation_count_norm && parseInt(doc.citation_count_norm) > 0 ? (
      <Link href={`/abs/${bibcode}/citations`}>
        <a className="link">
          <span>cited(n): {doc.citation_count_norm}</span>
        </a>
      </Link>
    ) : null
  ) : doc.citation_count && parseInt(doc.citation_count) > 0 ? (
    <Link href={`/abs/${bibcode}/citations`}>
      <a className="link">
        <span>cited: {doc.citation_count}</span>
      </a>
    </Link>
  ) : null;

  // full text sources and data

  let fullSourceItems: ItemType[] = [];

  let dataProductItems: ItemType[] = [];

  if (!hideActions && doc.esources) {
    const sources = processLinkData(doc, null);

    const fullTextSources = sources.fullTextSources;

    const dataProducts = sources.dataProducts;

    fullSourceItems = fullTextSources.map((source) => ({
      id: source.name,
      text: source.name,
      label: source.name,
      path: source.url,
      domId: `fullText-${source.name}`,
      newTab: true,
    }));

    dataProductItems = dataProducts.map((dp) => ({
      id: dp.name,
      text: dp.name,
      label: dp.name,
      path: dp.url,
      domId: `dataProd-${dp.name}`,
      newTab: true,
    }));
  }

  const fullTextSourcesLabel = (
    <>
      {fullSourceItems.length > 0 ? (
        <DocumentTextIcon
          className="default-icon default-link-color cursor-pointer"
          aria-label="Full text sources"
          role="list"
        />
      ) : (
        <DocumentTextIcon className="default-icon text-gray-300" aria-label="No Full text sources" role="list" />
      )}
    </>
  );

  const dataProductLabel = (
    <>
      {dataProductItems.length > 0 ? (
        <DatabaseIcon
          className="default-icon default-link-color cursor-pointer"
          aria-label="Data products"
          role="list"
        />
      ) : (
        <DatabaseIcon className="default-icon text-gray-300" aria-label="No data products" role="list" />
      )}
    </>
  );

  // citations and references

  const num_references =
    !hideActions && doc['[citations]'] && typeof doc['[citations]'].num_references === 'number'
      ? doc['[citations]'].num_references
      : 0;

  const num_citations =
    !hideActions && doc['[citations]'] && typeof doc['[citations]'].num_citations === 'number'
      ? doc['[citations]'].num_citations
      : 0;

  const referenceItems: ItemType[] = [];
  if (num_citations > 0) {
    referenceItems.push({
      id: 'citations',
      domId: `ref-dropdown-cit-${doc.bibcode}`,
      label: `Citations (${num_citations})`,
      path: `/abs/${bibcode}/citations`,
    });
  }

  if (num_references > 0) {
    referenceItems.push({
      id: 'references',
      domId: `ref-dropdown-ref-${doc.bibcode}`,
      label: `References (${num_references})`,
      path: `/abs/${bibcode}/references`,
    });
  }

  const referencesLabel = (
    <>
      {referenceItems.length > 0 ? (
        <ViewListIcon
          className="default-icon default-link-color cursor-pointer"
          aria-label="References and citations"
          role="list"
        />
      ) : (
        <ViewListIcon className="default-icon text-gray-300" aria-label="No references and citations" role="list" />
      )}
    </>
  );

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
        <div className="flex flex-row justify-between pr-2 py-2">
          <Link href={`/abs/${bibcode}`}>
            <a className="text-blue-700 hover:underline">
              <h3 className="text-lg" id={`result-${id}`} dangerouslySetInnerHTML={{ __html: title[0] }}></h3>
            </a>
          </Link>
          <div className="flex items-start">
            {hideActions ? null : (
              <>
                {fullSourceItems.length > 0 ? (
                  <ItemDropdown label={fullTextSourcesLabel} items={fullSourceItems} />
                ) : (
                  fullTextSourcesLabel
                )}
                {referenceItems.length > 0 ? (
                  <ItemDropdown label={referencesLabel} items={referenceItems} />
                ) : (
                  referencesLabel
                )}
                {dataProductItems.length > 0 ? (
                  <ItemDropdown label={dataProductLabel} items={dataProductItems} />
                ) : (
                  dataProductLabel
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          {author.length > 0 && (
            <div className="text-s">
              {author.slice(0, 10).join('; ')}
              {author_count > 10 && <span className="text-xs italic"> and {author_count - 10} more</span>}
            </div>
          )}
          <div className="flex py-1">
            <span className="text-xs">
              {formattedPubDate}
              {formattedPubDate && formattedBibstem ? ' | ' : ''}
              {formattedBibstem}
              {doc.citation_count &&
                parseInt(doc.citation_count) > 0 &&
                (formattedPubDate || formattedBibstem) &&
                ' | '}
              {cite}
            </span>
            {citation && <span className="text-xs">cite: {citation}</span>}
          </div>
          <AbstractPreview id={id} />
        </div>
      </div>
    </article>
  );
};

interface IItemDropdownProps {
  label: ReactElement | string;
  items: ItemType[];
}

export const ItemDropdown = ({ label, items }: IItemDropdownProps): ReactElement => {
  const viewport = useViewport();
  const listClasses = viewport > Viewport.MD ? 'h-auto w-auto' : 'h-auto w-auto absolute top-full -right-0';
  return (
    <span>
      <SimpleLinkDropdown
        items={items}
        label={label}
        selected={''}
        aria-label="Full Text Sources"
        classes={{
          list: listClasses,
          item: 'p-2 flex justify-start text-sm',
        }}
      />
    </span>
  );
};
