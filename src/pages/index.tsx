import { SearchBar, SearchExamples } from '@components';
import { CodeIcon, SearchCircleIcon, SupportIcon } from '@heroicons/react/solid';
import { useSearchMachine } from '@machines';
import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';

const HomePage: NextPage = () => {
  const { service: searchService } = useSearchMachine();
  const handleExampleClick: (text: string) => void = (text) => {
    console.log('example click', text);
  };

  return (
    <section aria-labelledby="form-title">
      <form
        method="get"
        action="/search"
        className="grid gap-6 grid-cols-6 mx-auto my-8 px-4 py-8 lg:max-w-3xl"
      >
        <h2 className="sr-only" id="form-title">
          Modern Search Form
        </h2>
        <div className="col-span-6">
          <SearchBar service={searchService} />
        </div>
        <div className="col-span-6">
          <SearchExamples onClick={handleExampleClick} />
        </div>
      </form>
    </section>
  );
};

const BottomLink = ({ icon, text }: { icon: React.ReactElement; text: string }): React.ReactElement => (
  <div className="col-span-6 md:col-span-2">
    <Link href="/paper-form">
      <a className="flex flex-col items-center justify-center p-4 text-blue-500 hover:bg-gray-200">
        {icon}
        <div className="font-bold text-center">{text}</div>
      </a>
    </Link>
  </div>
);

export default HomePage;
