import Link from 'next/link';
import React, { FC } from 'react';
import { AboutDropdown } from './AboutDropdown';
import { OrcidDropdown } from './OrcidDropdown';

export const NavBar: FC = ({}) => {
  return (
    <nav className="bg-gray-1000 flex">
      <div className="px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <a className="flex items-center h-12">
            <img
              className="h-10 w-10"
              src="/img/transparent_logo.svg"
              alt="Workflow logo"
            />
            <h1 className="text-white text-2xl font-medium ml-2">ads</h1>
          </a>
        </Link>
      </div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only text-white flex items-center"
      >
        Skip to content
      </a>
      <div className="flex-grow flex justify-end items-center space-x-4 pr-4">
        <OrcidDropdown />
        <AboutDropdown />
        <Link href="/signup">
          <a className="text-gray-300 hover:text-white focus:text-white">
            Sign Up Now
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
