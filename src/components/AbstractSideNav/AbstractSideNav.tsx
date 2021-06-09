import { IDocsEntity } from '@api';
import { DocumentIcon } from '@heroicons/react/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { last } from 'ramda';
import React, { HTMLAttributes } from 'react';
import { navigation, Routes } from './model';

export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSideNav = ({ doc }: IAbstractSideNavProps): React.ReactElement => {
  const router = useRouter();
  const subPage = last(router.asPath.split('/'));

  return (
    <nav className="hidden self-start my-8 p-1 bg-white shadow space-y-1 sm:block sm:rounded-lg" aria-label="Sidebar">
      {navigation.map((item) => {
        const Icon = item.icon || DocumentIcon;
        const current = item.href === subPage;
        const count = getCount(item.href, doc);
        const disabled = count === 0 && item.href !== Routes.ABSTRACT;
        const showCount = count > 0 && item.href !== Routes.SIMILAR;
        const href = { pathname: disabled ? Routes.ABSTRACT : item.href, query: { id: router.query.id } };

        const linkStyle = clsx(
          current ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
          disabled && 'opacity-50 pointer-events-none',
        );
        const iconStyle = clsx(
          current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
          'flex-shrink-0 mr-3 w-6 h-6',
        );
        const countStyle = clsx(
          current ? 'bg-white' : 'bg-gray-100 group-hover:bg-gray-200',
          'inline-block ml-3 px-3 py-0.5 text-xs rounded-full',
        );
        return (
          <Link key={item.name} href={href}>
            <a className={linkStyle} aria-current={current ? 'page' : undefined}>
              <Icon className={iconStyle} aria-hidden="true" />
              <span className="flex-1 truncate">{item.name}</span>
              {showCount ? <span className={countStyle}>{count}</span> : null}
            </a>
          </Link>
        );
      })}
    </nav>
  );
};

const getCount = (route: Routes, doc: IDocsEntity) => {
  if (!doc) {
    return 0;
  }

  switch (route) {
    case Routes.CITATIONS:
      return typeof doc.citation_count === 'number' ? doc.citation_count : 0;
    case Routes.REFERENCES:
      return typeof doc['[citations]'].num_references === 'number' ? doc['[citations]'].num_references : 0;
    case Routes.COREADS:
      return typeof doc.read_count === 'number' ? doc.read_count : 0;
    case Routes.SIMILAR:
      return typeof doc.abstract !== 'undefined' ? 1 : 0;
    default:
      return 0;
  }
};
