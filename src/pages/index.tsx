import { SearchBar, SearchExamples } from '@components';
import {
  faCode,
  faLifeRing,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';

const HomePage: NextPage = () => {
  const handleExampleClick: (text: string) => void = (text) => {
    console.log('example click', text);
  };

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    console.log('submit');
  };

  return (
    <>
      <h2 className="sr-only">Modern Search Form</h2>
      <form action="search" method="get" onSubmit={handleSubmit}>
        <div className="my-6">
          <SearchBar />
        </div>
        <div className="mt-4">
          <h3 className="mb-3 text-center text-lg font-bold">
            Search Examples
          </h3>
          <SearchExamples onClick={handleExampleClick} />
        </div>
      </form>
      <hr className="mx-auto my-4 w-3/4 divide-x-0" />
      <div className="flex flex-col justify-evenly mx-auto w-3/4 md:flex-row">
        <Link href="/classic-form">
          <a className="flex flex-col items-center justify-center p-4 text-blue-500 hover:bg-gray-200">
            <div className="my-4 text-4xl">
              <FontAwesomeIcon icon={faLifeRing} />
            </div>
            <div className="font-bold">Use a classic ADS-style form</div>
          </a>
        </Link>
        <Link href="/paper-form">
          <a className="flex flex-col items-center justify-center p-4 text-blue-500 hover:bg-gray-200">
            <div className="my-4 text-4xl">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <div className="font-bold">Learn more about searching the ADS</div>
          </a>
        </Link>
        <Link href="#">
          <a className="flex flex-col items-center justify-center p-4 text-blue-500 hover:bg-gray-200">
            <div className="my-4 text-4xl">
              <FontAwesomeIcon icon={faCode} />
            </div>
            <div className="font-bold">Access ADS data with our API</div>
          </a>
        </Link>
      </div>
    </>
  );
};

export default HomePage;
