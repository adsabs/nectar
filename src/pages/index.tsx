import { SearchBar, SearchExamples } from '@components';
import { useSearchMachine } from '@machines';
import { NextPage } from 'next';
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

export default HomePage;
