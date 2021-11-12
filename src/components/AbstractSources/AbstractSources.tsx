import { IDocsEntity } from '@api';
import { DropdownList } from '@components';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { ItemType } from '@components/Dropdown/types';
import { ChevronDownIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/solid';
import { isBrowser } from '@utils';
import { isNil } from 'ramda';
import { HTMLAttributes, ReactElement } from 'react';
import { IDataProductSource, IFullTextSource, IRelatedWorks, processLinkData } from './linkGenerator';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): ReactElement => {
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

const dropdownButtonClasses = 'button-sm pl-2 pr-1 cursor-pointer';

const dropdownButtonClassesInactive = 'button-sm-disabled pl-2 pr-1 cursor-default';

interface IFullTextDropdownProps {
  sources: IFullTextSource[];
}

const FullTextDropdown = (props: IFullTextDropdownProps): ReactElement => {
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

  const label = (
    <div className={sources.length > 0 ? dropdownButtonClasses : dropdownButtonClassesInactive}>
      Full Text Sources{' '}
      {sources.find((s) => s.open) !== undefined ? <LockOpenIcon className="default-icon-sm inline" /> : null}
      <ChevronDownIcon className="default-icon-sm inline" />
    </div>
  );

  return (
    <>
      {isBrowser() ? (
        <DropdownList
          label={label}
          items={fullSourceItems}
          onSelect={handleSelect}
          placement={'bottom-start'}
          classes={{ button: sources.length === 0 ? 'cursor-default' : '', list: '' }}
          offset={[0, 2]}
          role="list"
          ariaLabel="Full Text Sources"
          itemRole="listitem"
        ></DropdownList>
      ) : (
        <span>
          <SimpleLinkDropdown
            items={fullSourceItems}
            label={label}
            selected={''}
            aria-label="Full Text Sources"
            classes={{
              label: fullSourceItems.length > 0 ? dropdownButtonClasses : dropdownButtonClassesInactive,
              list: 'w-60 h-auto',
              item: 'p-2 flex justify-start',
            }}
          />
        </span>
      )}
    </>
  );
};

interface IRelatedMaterialsDropdownProps {
  dataProducts: IDataProductSource[];
  relatedWorks: IRelatedWorks[];
}

const DataProductDropdown = (props: IRelatedMaterialsDropdownProps): ReactElement => {
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
      path: '',
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
      path: '',
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

  const label = (
    <div className={items.length > 0 ? dropdownButtonClasses : dropdownButtonClassesInactive}>
      Other Resources <ChevronDownIcon className="default-icon-sm inline" />
    </div>
  );

  return (
    <>
      {isBrowser() ? (
        <div>
          <DropdownList
            label={label}
            items={items}
            onSelect={handleSelect}
            classes={{ button: items.length === 0 ? 'cursor-default' : '', list: '' }}
            placement={'bottom-start'}
            offset={[0, 2]}
            role="list"
            ariaLabel="Other Resources"
            itemRole="listitem"
          />
        </div>
      ) : (
        <span>
          {items.length > 0 ? (
            <SimpleLinkDropdown
              items={items}
              label={label}
              selected={''}
              aria-label="Other Resources"
              classes={{
                list: 'w-60 h-auto',
                item: 'p-2',
              }}
            />
          ) : (
            <>{label}</>
          )}
        </span>
      )}
    </>
  );
};
