import { BibstemPickerSingle, Button, TextInput } from '@components';
import { NextPage } from 'next';
import React from 'react';

type FormType = 'journal-query' | 'reference-query' | 'bibcode-query';

const PaperForm: NextPage = () => {
  const onSubmit = (type: FormType) => {
    return (e) => {
      console.log('submit', type, e);
    };
  };

  const renderButtonGroup = () => (
    <>
      <Button size="sm" className="mt-3">
        Search
      </Button>
      <Button variant="link" className="mt-3" type="reset">
        Reset
      </Button>
    </>
  );

  return (
    <article className="grid gap-6 grid-cols-6 mx-auto my-4 px-4 py-12 max-w-3xl">
      {/* Journal Query */}
      <section className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md" aria-labelledby="form-title">
        <h2 className="text-gray-900 text-lg font-medium leading-6" id="journal-search-form">
          Journal Search
        </h2>
        <div className="prose-sm p-2">
          A bibstem is an abbreviation that the ADS uses to identify a journal. A full list is available here. The input
          field below will autocomplete on our current database of journal names, allowing you to type "Astrophysical
          Journal", for instance, to find the bibstem "ApJ".
        </div>
        <form
          onSubmit={onSubmit('journal-query')}
          method="post"
          action="/api/paper-form"
          className="grid gap-x-4 grid-cols-6 mt-1 pt-2 px-2 border-t"
        >
          <input type="hidden" name="type" value="journal-query" />

          {/* Bibstem picker */}
          <div className="col-span-6">
            {process.browser ? <BibstemPickerSingle /> : <TextInput name="bibstems" label="Bibstems" />}
          </div>

          <div className="col-span-2 mt-2">
            <TextInput label="Year" name="year" />
          </div>
          <div className="col-span-2 mt-2">
            <TextInput label="Volume" name="volume" />
          </div>
          <div className="col-span-2 mt-2">
            <TextInput label="Page/ID" name="pageid" />
          </div>
          {renderButtonGroup()}
        </form>
      </section>

      {/* Reference Query */}
      <section className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md" aria-labelledby="form-title">
        <h2 className="text-gray-900 text-lg font-medium leading-6" id="journal-search-form">
          Reference Query
        </h2>
        <form method="post" action="/api/paper-form" className="grid gap-x-4 grid-cols-6 mt-1 pt-2 px-2 border-t">
          <input type="hidden" name="type" value="reference-query" />

          <div className="col-span-6 mt-3">
            <TextInput
              label="Reference"
              name="reference"
              helptext={`Enter a full reference string (eg Smith et al 2000, A&A 362, pp. 333-341)`}
            />
          </div>
          {renderButtonGroup()}
        </form>
      </section>

      {/* Bibcode Query */}
      <section className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md" aria-labelledby="form-title">
        <h2 className="text-gray-900 text-lg font-medium leading-6" id="journal-search-form">
          Bibliographic Code Query
        </h2>
        <form method="post" action="/api/paper-form" className="grid gap-x-4 grid-cols-6 mt-1 pt-2 px-2 border-t">
          <input type="hidden" name="type" value="bibcode-query" />

          <div className="col-span-6 mt-3">
            <label htmlFor="bibcode" className="block text-gray-700 text-sm font-bold">
              List of Bibcodes
            </label>
            <div className="mt-1">
              <textarea
                name="bibcode"
                id="bibcode"
                className="block w-full border border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm"
              />
              <div className="prose-sm prose text-gray-500">
                Enter list of Bibcodes (e.g. 1989ApJ...342L..71R), one per line.
              </div>
            </div>
          </div>
          {renderButtonGroup()}
        </form>
      </section>
    </article>
  );
};

export default PaperForm;
