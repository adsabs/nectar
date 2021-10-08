import Link from 'next/link';
import React, { FC } from 'react';
import { ThemeDropdown } from './ThemeDropdown';
import styles from './NavBar.module.css';
import clsx from 'clsx';
import { NavMenus } from './NavMenus';
import { isBrowser } from '@utils';

export const NavBar: FC = () => {
  const navbarClasses = clsx(styles['navbar-bg-color'], 'relative flex items-center');

  return (
    <nav className={navbarClasses}>
      <div className="px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <a className="flex items-center h-12">
            <img className="w-10 h-10" src="/img/transparent_logo.svg" aria-hidden="true" />
            <h1 className="hidden ml-2 text-white text-2xl font-bold sm:inline">SciX</h1>
          </a>
        </Link>
      </div>
      <ThemeDropdown />
      <a href="#main-content" className="flex items-center text-white focus:not-sr-only sr-only">
        Skip to content
      </a>
      {!isBrowser() ? null : <NavMenus />}
    </nav>
  );
};
