import Link from 'next/link';
import React from 'react';

const NavBar: React.FC = () => {
  return (
    <nav className="bg-gray-900 flex">
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
      <div className="flex-grow flex justify-end items-center">
        <Link href="/login">
          <a className="px-4 py-1 mr-3 rounded-md bg-gray-700 text-white hover:text-white hover:bg-gray-500 focus:text-white focus:bg-gray-500">
            Login
          </a>
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
