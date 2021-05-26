import { NextPage } from 'next';
import React from 'react';

const PaperForm: NextPage = () => {
  return (
    <form className="grid gap-6 grid-cols-6 mx-auto my-4 px-4 py-12 max-w-3xl">
      <div className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md sm:overflow-hidden">
        <h2 className="text-gray-900 text-lg font-medium leading-6">
          Journal Search
        </h2>
        <div className="flex justify-center">
          <div className="prose-sm prose">
            A bibstem is an abbreviation that the ADS uses to identify a
            journal. A full list is available here. The input field below will
            autocomplete on the 1,000 most popular journal names, allowing you
            to type "Astrophysical Journal", for instance, to find the bibstem
            "ApJ".
          </div>
        </div>
      </div>
      <div className="col-span-6">Reference Query</div>
      <div className="col-span-6">Bibliographic Code Query</div>
    </form>
  );
};

export default PaperForm;
