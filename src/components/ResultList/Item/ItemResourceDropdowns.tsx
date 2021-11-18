import { ItemType } from '@components/Dropdown/types';
import { ReactElement } from 'react';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { IDocsEntity } from '@api';
import { processLinkData } from '@components/AbstractSources/linkGenerator';
import { DatabaseIcon, DocumentTextIcon, ViewListIcon } from '@heroicons/react/outline';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/solid';

export interface IItemResourceDropdownsProps {
  doc: IDocsEntity;
}

export const ItemResourceDropdowns = ({ doc }: IItemResourceDropdownsProps): ReactElement => {
  let fullSourceItems: ItemType[] = [];

  let dataProductItems: ItemType[] = [];

  if (doc.esources) {
    const sources = processLinkData(doc, null);

    const fullTextSources = sources.fullTextSources;

    const dataProducts = sources.dataProducts;

    fullSourceItems = fullTextSources.map((source) => ({
      id: source.name,
      text: source.name,
      label: source.open ? (
        <>
          <LockOpenIcon className="default-icon-sm inline" fill="green" aria-hidden />
          {` ${source.name}`}
        </>
      ) : (
        <>
          <LockClosedIcon className="default-icon-sm inline" aria-hidden />
          {` ${source.name}`}
        </>
      ),
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
    doc['[citations]'] && typeof doc['[citations]'].num_references === 'number' ? doc['[citations]'].num_references : 0;

  const num_citations =
    doc['[citations]'] && typeof doc['[citations]'].num_citations === 'number' ? doc['[citations]'].num_citations : 0;

  const referenceItems: ItemType[] = [];
  if (num_citations > 0) {
    referenceItems.push({
      id: 'citations',
      domId: `ref-dropdown-cit-${doc.bibcode}`,
      label: `Citations (${num_citations})`,
      path: `/abs/${doc.bibcode}/citations`,
    });
  }

  if (num_references > 0) {
    referenceItems.push({
      id: 'references',
      domId: `ref-dropdown-ref-${doc.bibcode}`,
      label: `References (${num_references})`,
      path: `/abs/${doc.bibcode}/references`,
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
    <>
      {fullSourceItems.length > 0 ? (
        <ItemDropdown label={fullTextSourcesLabel} items={fullSourceItems} />
      ) : (
        fullTextSourcesLabel
      )}
      {referenceItems.length > 0 ? <ItemDropdown label={referencesLabel} items={referenceItems} /> : referencesLabel}
      {dataProductItems.length > 0 ? (
        <ItemDropdown label={dataProductLabel} items={dataProductItems} />
      ) : (
        dataProductLabel
      )}
    </>
  );
};

interface IItemDropdownProps {
  label: ReactElement | string;
  items: ItemType[];
}

export const ItemDropdown = ({ label, items }: IItemDropdownProps): ReactElement => {
  return (
    <span tabIndex={0}>
      <SimpleLinkDropdown
        items={items}
        label={label}
        selected={''}
        aria-label="Full Text Sources"
        classes={{
          list: 'h-auto w-auto absolute top-full -right-0 lg:left-0 lg:right-auto',
          item: 'p-2 flex justify-start text-sm border-b',
        }}
        role={{ label: 'list', item: 'listitem' }}
      />
    </span>
  );
};
