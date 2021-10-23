import { AdsSmallLogo } from '@components/images';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FC } from 'react';
import styles from './NavBar.module.css';

const ThemeDropdown = dynamic(() => import('./ThemeDropdown').then((mod) => mod.ThemeDropdown), { ssr: false });

const NavMenus = dynamic(() => import('./NavMenus').then((mod) => mod.NavMenus), { ssr: false });

export const NavBar: FC = () => {
  const navbarClasses = clsx(styles['navbar-bg-color'], 'relative flex items-center');

  return (
    <nav className={navbarClasses}>
      <div className="px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <a className="flex items-center h-12">
            <AdsSmallLogo className="w-10 h-10" aria-hidden />
            <h1 className="hidden ml-2 text-white text-2xl font-bold sm:inline">SciX</h1>
          </a>
        </Link>
      </div>
      <ThemeDropdown />
      <a href="#main-content" className="flex items-center text-white focus:not-sr-only sr-only">
        Skip to content
      </a>
      <NavMenus />
    </nav>
  );
};
