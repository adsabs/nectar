import { BibstemPickerSingle, TextInput } from '@components';
import { NextPage } from 'next';
import React from 'react';

const inputCls =
  'shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md';

const PaperForm: NextPage = () => {
  const handleChange = () => {};

  return (
    <article className="grid gap-6 grid-cols-6 mx-auto my-4 px-4 py-12 max-w-3xl">
      <section className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md" aria-labelledby="form-title">
        <h2 className="text-gray-900 text-lg font-medium leading-6" id="journal-search-form">
          Journal Search
        </h2>
        <div className="prose-sm p-2">
          A bibstem is an abbreviation that the ADS uses to identify a journal. A full list is available here. The input
          field below will autocomplete on our current database of journal names, allowing you to type "Astrophysical
          Journal", for instance, to find the bibstem "ApJ".
        </div>
        <form action="/api/paper-form" className="grid gap-x-4 grid-cols-4 px-2">
          <input type="hidden" name="type" value="journal-search" />

          {/* Bibstem picker */}
          <div className="col-span-4">
            {process.browser ? (
              <BibstemPickerSingle />
            ) : (
              <TextInput
                onChange={handleChange}
                name="bibstems"
                label="Bibstems"
                classes={{
                  label: 'block text-gray-700 text-sm font-bold',
                }}
              />
            )}
          </div>

          <div className="col-span-1">
            <TextInput label="Year" name="year" />
          </div>
        </form>
      </section>
      <div className="col-span-6">Reference Query</div>
      <div className="col-span-6">Bibliographic Code Query</div>
    </article>
  );
};

export default PaperForm;
