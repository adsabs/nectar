import { IDocsEntity } from '@api';
import { DropdownList } from '@components';
import { ChevronDownIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/solid';
import { useViewport, Viewport } from '@hooks';
import { isNil } from 'ramda';
import React, { HTMLAttributes } from 'react';
import { IAssociatedWorks, IDataProductSource, IFullTextSource, processLinkData } from './linkGenerator';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): React.ReactElement => {
  const viewport = useViewport();

  if (!doc) {
    return <button className="default-button-inactive">Full Text Sources</button>;
  }

  const { esources } = doc;
  if (isNil(esources)) {
    return <h3 className="leading-3">No Sources</h3>;
  }
  const sources = processLinkData(doc, null);

  return viewport >= Viewport.SM ? (
    <section className="flex justify-start ml-0">
      <FullTextDropdown sources={sources.fullTextSources} />
      <DataProductDropdown sources={sources.dataProducts} />
      <AssociatedWorksDropdown sources={sources.dataProducts} />
      <button className="default-button px-2">Add to library</button>
    </section>
  ) : (
    <>
      <section className="flex justify-start ml-0">
        <FullTextDropdown sources={sources.fullTextSources} />
        <DataProductDropdown sources={sources.dataProducts} />
      </section>
      <section className="flex justify-start ml-0">
        <AssociatedWorksDropdown sources={sources.dataProducts} />
        <button className="default-button px-2">Add to library</button>
      </section>
    </>
  );
};

///// dropdown components //////

const dropdownClasses = {
  button: 'default-button pl-2 pr-1',
  list: 'border border-gray-400',
};

const dropdownClassesInactive = {
  button: 'default-button-disabled pl-2 pr-1',
  list: 'border border-gray-400',
};
interface IFullTextDropdownProps {
  sources: IFullTextSource[];
}

const FullTextDropdown = (props: IFullTextDropdownProps): React.ReactElement => {
  const { sources } = props;

  const fullSourceItems = sources.map((source) => ({
    id: source.name,
    label: source.open ? (
      <>
        {source.description} <LockOpenIcon className="default-icon-sm inline" />
      </>
    ) : (
      <>
        {source.description} <LockClosedIcon className="default-icon-sm inline" />
      </>
    ),
    path: source.url,
    domId: `fullText-${source.name}`,
  }));

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined')
      window.open(fullSourceItems.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
  };

  return (
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
  );
};

interface IDataProductDropdownProps {
  sources: IDataProductSource[];
}

const DataProductDropdown = (props: IDataProductDropdownProps): React.ReactElement => {
  const { sources } = props;

  const dataProductItems = sources.map((source) => ({
    id: source.name,
    label: source.description,
    path: source.url,
    domId: `dataProd-${source.name}`,
  }));

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined')
      window.open(dataProductItems.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
  };

  return (
    <DropdownList
      label="Data Products"
      items={dataProductItems}
      onSelect={handleSelect}
      classes={dataProductItems.length > 0 ? dropdownClasses : dropdownClassesInactive}
      placement={'bottom-start'}
      offset={[0, 2]}
      role="list"
      ariaLabel="Data Products"
    ></DropdownList>
  );
};

interface IAssociatedWorksDropdownProps {
  sources: IAssociatedWorks[];
}

const AssociatedWorksDropdown = (props: IAssociatedWorksDropdownProps): React.ReactElement => {
  const { sources } = props;

  const associatedWorksItems = sources.map((source) => ({
    id: source.name,
    label: source.description,
    path: source.url,
    domId: `associatedWorks-${source.name}`,
  }));

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined')
      window.open(associatedWorksItems.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
  };

  return (
    <DropdownList
      label="Associated Works"
      items={associatedWorksItems}
      onSelect={handleSelect}
      classes={associatedWorksItems.length > 0 ? dropdownClasses : dropdownClassesInactive}
      placement={'bottom-start'}
      offset={[0, 2]}
      role="list"
      ariaLabel="Associated Works"
    ></DropdownList>
  );
};
