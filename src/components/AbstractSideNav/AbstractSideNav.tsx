import {
  ChartPieIcon,
  ClipboardListIcon,
  CollectionIcon,
  DocumentIcon,
  DocumentTextIcon,
  DownloadIcon,
  DuplicateIcon,
  PhotographIcon,
  TableIcon,
  UsersIcon,
} from '@heroicons/react/outline';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { last } from 'ramda';
import React, { FC, HTMLAttributes, ReactChild } from 'react';

export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild;
}

export const AbstractSideNav: FC<IAbstractSideNavProps> = ({}) => {
  const router = useRouter();
  const subPage = last(router.asPath.split('/'));
  const navigation = [
    { name: 'Abstract', href: 'abstract', current: 'abstract' === subPage, count: 0, icon: DocumentTextIcon },
    { name: 'Citations', href: 'citations', current: 'citations' === subPage, count: 0, icon: CollectionIcon },
    { name: 'References', href: 'references', current: 'references' === subPage, count: 0, icon: ClipboardListIcon },
    { name: 'Co-Reads', href: 'coreads', current: 'coreads' === subPage, count: 0, icon: UsersIcon },
    { name: 'Similar Papers', href: 'similar', current: 'similar' === subPage, count: 0, icon: DuplicateIcon },
    {
      name: 'Volume Content',
      href: 'tableofcontents',
      current: 'tableofcontents' === subPage,
      count: 0,
      icon: TableIcon,
    },
    { name: 'Graphics', href: 'graphics', current: 'graphics' === subPage, count: 0, icon: PhotographIcon },
    { name: 'Metrics', href: 'metrics', current: 'metrics' === subPage, count: 0, icon: ChartPieIcon },
    {
      name: 'Export Citation',
      href: 'exportcitation',
      current: 'exportcitation' === subPage,
      count: 0,
      icon: DownloadIcon,
    },
  ];
  return (
    <nav className="hidden self-start my-8 p-1 bg-white shadow space-y-1 sm:block sm:rounded-lg" aria-label="Sidebar">
      {navigation.map((item) => {
        const Icon = item.icon || DocumentIcon;
        return (
          <a
            key={item.name}
            href={item.href}
            className={clsx(
              item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
            )}
            aria-current={item.current ? 'page' : undefined}
          >
            <Icon
              className={clsx(
                item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                'flex-shrink-0 -ml-1 mr-3 w-6 h-6',
              )}
              aria-hidden="true"
            />
            <span className="truncate">{item.name}</span>
            {item.count ? (
              <span
                className={clsx(
                  item.current ? 'bg-white' : 'bg-gray-100 group-hover:bg-gray-200',
                  'inline-block ml-auto px-3 py-0.5 text-xs rounded-full',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
};
