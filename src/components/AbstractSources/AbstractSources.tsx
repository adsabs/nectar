import { IDocsEntity } from '@api';
import { DatabaseIcon, DocumentTextIcon } from '@heroicons/react/outline';
import { ExternalLinkIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import Link from 'next/link';
import { isNil } from 'ramda';
import React, { HTMLAttributes } from 'react';
import { IDataProductSource, IFullTextSource, processLinkData } from './linkGenerator';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): React.ReactElement => {
  if (!doc) {
    return null;
  }
  const renderSources = () => {
    const { esources } = doc;
    if (isNil(esources)) {
      return <h3 className="leading-3">No Sources</h3>;
    }
    const sources = processLinkData(doc, null);

    return (
      <section>
        <h3 id="sources" className="sr-only">
          Sources
        </h3>
        <div className="grid gap-1 grid-cols-12 md:gap-4">
          {sources.fullTextSources.map((sourceData) => (
            <FullTextSource key={sourceData.name} source={sourceData} />
          ))}
        </div>
        <div className="grid gap-1 grid-cols-12 mt-1 md:gap-4">
          {sources.dataProducts.map((sourceData) => (
            <DataProduct key={sourceData.name} source={sourceData} />
          ))}
        </div>
      </section>
    );
  };

  return <div className="py-4 border-b border-gray-200 sm:px-6 sm:py-5">{renderSources()}</div>;
};

interface IFullTextSourceProps {
  source: IFullTextSource;
}
const FullTextSource = ({ source }: IFullTextSourceProps): React.ReactElement => {
  const iconStyle = clsx('w-6 h-6', source.open ? 'text-green-400' : 'text-blue-400');

  return (
    <Link href={source.url}>
      <a
        title={`${source.description}${source.open ? ' (OPEN ACCESS)' : ''}`}
        className="flex col-span-4 items-center p-1 hover:bg-gray-100 border border-gray-400 rounded-md space-x-1 md:col-span-3"
      >
        <DocumentTextIcon className={iconStyle} />
        <span className="flex-1">{source.name}</span>
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
    </Link>
  );
};

interface IDataProductsProps {
  source: IDataProductSource;
}
const DataProduct = ({ source }: IDataProductsProps): React.ReactElement => {
  return (
    <Link href={source.url}>
      <a
        title={source.description}
        className="flex col-span-4 items-center p-1 hover:bg-gray-100 border border-gray-400 rounded-md space-x-1 md:col-span-3"
      >
        <DatabaseIcon className="w-6 h-6" />
        <span className="flex-1">{source.name}</span>
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
    </Link>
  );
};
