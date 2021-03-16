import {
  faCode,
  faLifeRing,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '@nectar/api';
import { SearchBar, SearchExamples } from '@nectar/components';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import React from 'react';

interface IHomePageProps {
  docs: string[];
}

const HomePage: NextPage<IHomePageProps> = ({ docs }) => {
  const handleExampleClick: (text: string) => void = (text) => {
    console.log('example click', text);
  };

  return (
    <>
      <div>{docs}</div>
      <h2 className="sr-only">Modern Search Form</h2>
      <form action="search" method="get">
        <div className="my-6">
          <SearchBar />
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

export const getServerSideProps: GetServerSideProps<IHomePageProps> = async () => {
  const res = await api.search.query({ q: 'star' });
  console.log({ res });
  return new Promise((resolve) => {
    const docs = [''];
    return resolve({
      props: {
        docs,
      },
    });
  });
};

export default HomePage;
