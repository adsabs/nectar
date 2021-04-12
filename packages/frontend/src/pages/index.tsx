import {
  faCode,
  faLifeRing,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SearchBar, SearchExamples } from '@nectar/components';
import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';

const HomePage: NextPage = () => {
  const handleExampleClick: (text: string) => void = (text) => {
    console.log('example click', text);
  };

  return (
    <>
      <h2 className="sr-only">Modern Search Form</h2>
      <form action="search" method="get">
        <div className="my-6">
          <SearchBar onSubmit={() => { }} />
        </div>
        <div className="mt-4">
          <h3 className="text-lg text-center mb-3 font-bold">
            Search Examples
          </h3>
          <SearchExamples onClick={handleExampleClick} />
        </div>
      </form>
      <hr className="divide-x-0 my-4 w-3/4 mx-auto" />
      <div className="flex w-3/4 mx-auto justify-evenly flex-col md:flex-row">
        <Link href="#">
          <a className="text-blue-500 p-4 hover:bg-gray-200 flex flex-col items-center  justify-center ">
            <div className="text-4xl my-4">
              <FontAwesomeIcon icon={faLifeRing} />
            </div>
            <div className="font-bold">Use a classic ADS-style form</div>
          </a>
        </Link>
        <Link href="#">
          <a className="text-blue-500 p-4 hover:bg-gray-200 flex flex-col items-center justify-center ">
            <div className="text-4xl my-4">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <div className="font-bold">Learn more about searching the ADS</div>
          </a>
        </Link>
        <Link href="#">
          <a className="text-blue-500 p-4 hover:bg-gray-200 flex flex-col items-center  justify-center ">
            <div className="text-4xl my-4">
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
