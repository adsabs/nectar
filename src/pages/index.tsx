import { SearchBar, SearchExamples } from '@components';
import {
  CodeIcon,
  SearchCircleIcon,
  SupportIcon,
} from '@heroicons/react/solid';
import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';

const HomePage: NextPage = () => {
  const handleExampleClick: (text: string) => void = (text) => {
    console.log('example click', text);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="sr-only">Modern Search Form</h2>
      <form
        action="search"
        method="get"
        className="grid gap-4 grid-cols-6 my-4"
      >
        <div className="col-span-6">
          <SearchBar />
        </div>
        <div className="col-span-6">
          <SearchExamples onClick={handleExampleClick} />
        </div>
        <hr className="col-span-6" />
        <BottomLink
          icon={<SupportIcon className="my-4 w-16 h-16" />}
          text="Use a classic ADS-style form"
        />
        <BottomLink
          icon={<SearchCircleIcon className="my-4 w-16 h-16" />}
          text="Learn more about searching the ADS"
        />
        <BottomLink
          icon={<CodeIcon className="my-4 w-16 h-16" />}
          text="Access ADS data with our API"
        />
      </form>
    </div>
  );
};

const BottomLink = ({
  icon,
  text,
}: {
  icon: React.ReactElement;
  text: string;
}): React.ReactElement => (
  <div className="col-span-6 md:col-span-2">
    <Link href="/paper-form">
      <a className="flex flex-col items-center justify-center p-4 text-blue-500 hover:bg-gray-200">
        {icon}
        <div className="text-center font-bold">{text}</div>
      </a>
    </Link>
  </div>
);

export default HomePage;
