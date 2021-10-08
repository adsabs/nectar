import { IDocsEntity } from '@api';
import { DropdownList } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { ChevronDownIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/solid';
import { isBrowser } from '@utils';
import Link from 'next/link';
import { isNil } from 'ramda';
import React, { HTMLAttributes } from 'react';
import { IRelatedWorks, IDataProductSource, IFullTextSource, processLinkData } from './linkGenerator';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): React.ReactElement => {
  if (!doc) {
    return <button className="button-sm-inactive">Full Text Sources</button>;
  }

  const { esources } = doc;
  if (isNil(esources)) {
    return <h3>No Sources</h3>;
  }
  const sources = processLinkData(doc, null);

  return (
    <section className="flex flex-wrap justify-start ml-0">
      <FullTextDropdown sources={sources.fullTextSources} />
      <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
      {isBrowser() ? <button className="button-sm px-2">Add to library</button> : null}
    </section>
  );
};

///// dropdown components //////

const dropdownClasses = {
  button: 'button-sm pl-2 pr-1',
  list: 'border border-gray-400',
};

const dropdownClassesInactive = {
  button: 'button-sm-disabled pl-2 pr-1',
  list: 'border border-gray-400',
};
interface IFullTextDropdownProps {
  sources: IFullTextSource[];
}

const FullTextDropdown = (props: IFullTextDropdownProps): React.ReactElement => {
  const { sources } = props;

  const fullSourceItems = sources.map((source) => ({
    id: source.name,
    text: source.name,
    label: source.open ? (
      <>
        <LockOpenIcon className="default-icon-sm inline" fill="green" />
        {` ${source.name}`}
      </>
    ) : (
      <>
        <LockClosedIcon className="default-icon-sm inline" />
        {` ${source.name}`}
      </>
    ),
    path: source.url,
    domId: `fullText-${source.name}`,
  }));

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined') {
      window.open(fullSourceItems.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {isBrowser() ? (
        <DropdownList
          label={
            sources.find((s) => s.open) !== undefined ? (
              <>
                Full Text Sources <LockOpenIcon className="default-icon-sm inline" />{' '}
                <ChevronDownIcon className="default-icon-sm inline" />
              </>
            ) : (
              'Full Text Sources'
            )
          }
          items={fullSourceItems}
          onSelect={handleSelect}
          classes={fullSourceItems.length > 0 ? dropdownClasses : dropdownClassesInactive}
          placement={'bottom-start'}
          offset={[0, 2]}
          role="list"
          ariaLabel="Full Text Sources"
        ></DropdownList>
      ) : (
        <>
          <div className="flex flex-col">
            <h3>Full Text Sources</h3>
            {fullSourceItems.map((item) => (
              <Link key={item.id} href={item.path}>
                <a className="link" ref="noreferrer noopener" target="_blank">
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
};

interface IRelatedMaterialsDropdownProps {
  dataProducts: IDataProductSource[];
  relatedWorks: IRelatedWorks[];
}

const DataProductDropdown = (props: IRelatedMaterialsDropdownProps): React.ReactElement => {
  const { dataProducts, relatedWorks } = props;

  const dataProductItems = dataProducts.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
    domId: `dataProd-${source.name}`,
    classes: 'pl-6',
  }));

  const relatedWorkItems = relatedWorks.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
    domId: `relatedWorks-${source.name}`,
    classes: 'pl-6',
  }));

  const items: ItemType[] = [];

  if (dataProductItems.length > 0) {
    // data product heading
    items.push({
      id: 'data-subheading',
      label: 'Data Products',
      domId: 'dataProducts',
      disabled: true,
    });
    items.push(...dataProductItems);
  }

  if (relatedWorkItems.length > 0) {
    // related works heading
    items.push({
      id: 'related-subheading',
      label: 'Related Materials',
      domId: 'relatedWorks',
      disabled: true,
    });
    items.push(...relatedWorkItems);
  }

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined') {
      const url = items.find((item) => id === item.id).path;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <>
      {isBrowser() ? (
        <DropdownList
          label="Other Resources"
          items={items}
          onSelect={handleSelect}
          classes={items.length > 0 ? dropdownClasses : dropdownClassesInactive}
          placement={'bottom-start'}
          offset={[0, 2]}
          role="list"
          ariaLabel="Other Resources"
        ></DropdownList>
      ) : null}
    </>
  );
};
