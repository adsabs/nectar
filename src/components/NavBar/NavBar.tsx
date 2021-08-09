import Link from 'next/link';
import React, { FC } from 'react';
import { ThemeDropdown } from './ThemeDropdown';
import { AboutDropdown } from './AboutDropdown';
import { OrcidDropdown } from './OrcidDropdown';
import styles from './NavBar.module.css'


export const NavBar: FC = () => {
  return (
    <nav className={`flex ${styles['navbar-bg-color']} items-center`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <a className="flex items-center h-12">
            <img
              className="w-10 h-10"
              src="/img/transparent_logo.svg"
              aria-hidden="true"
            />
            <h1 className="ml-2 text-white text-2xl font-bold">SciX</h1>
          </a>
        </Link>
      </div>
      <ThemeDropdown />
      <a
        href="#main-content"
        className="flex items-center text-white focus:not-sr-only sr-only"
      >
        Skip to content
      </a>
      <div className="flex flex-grow items-center justify-end pr-4 space-x-4">
        <OrcidDropdown />
        <AboutDropdown />
        <Link href="/user/account/register">
          <a className="text-gray-300 hover:text-white focus:text-white">
            Sign Up
          </a>
        </Link>
        <Link href="/login">
          <a className="text-gray-300 hover:text-white focus:text-white">
            Login
          </a>
        </Link>
      </div>
    </nav>
  );
};
