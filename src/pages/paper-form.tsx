import { BibstemPickerSingle, Button, TextInput } from '@components';
import { PaperFormType } from '@controllers/paperformController/types';
import axios from 'axios';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { NextPage } from 'next';
import qs from 'qs';
import React from 'react';

type Action = { type: 'UPDATE'; formType: PaperFormType; payload: { property: string; value: string } };
type PaperFormState = {
  [PaperFormType.JOURNAL_QUERY]: {
    bibstem?: string;
    year?: string;
    volume?: string;
    pageid?: string;
  };
  [PaperFormType.REFERENCE_QUERY]: {
    reference?: string;
  };
  [PaperFormType.BIBCODE_QUERY]: {
    bibcodes?: string;
  };
};

// const reducer: Reducer<PaperFormState, Action> = (state, action) => {
//   switch (action.type) {
//     case 'UPDATE':
//       return {
//         ...state,
//         [action.formType]: {
//           ...state[action.formType],
//           [action.payload.property]: action.payload.value,
//         },
//       };
//     default:
//       return state;
//   }
// };

const PaperForm: NextPage = () => {
  return (
    <article className="grid gap-6 grid-cols-6 mx-auto my-4 px-4 py-12 max-w-3xl">
      <JournalQueryForm />
      <ReferenceQueryForm />
      <BibcodeQueryForm />
    </article>
  );
};
export default PaperForm;
const JournalQueryForm = () => {
  const apiUrl = `/api/paperform/${PaperFormType.JOURNAL_QUERY}`;
  return (
    <Formik<PaperFormState[PaperFormType.JOURNAL_QUERY]>
      initialValues={{ bibstem: '', year: '', volume: '', pageid: '' }}
      onSubmit={async (values, { setSubmitting }) => {
        console.log(values);
        const response = await axios.post(apiUrl, qs.stringify(values, { indices: false }));

        console.log('response', response);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, handleReset, setFieldValue }) => {
        const handleBibstemUpdate = (bibstem: string) => setFieldValue('bibstem', bibstem, false);

        return (
          <section className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md" aria-labelledby="form-title">
            <h2 className="text-gray-900 text-lg font-medium leading-6" id="journal-search-form">
              Journal Search
            </h2>
            <div className="prose-sm p-2">
              A bibstem is an abbreviation that the ADS uses to identify a journal. A full list is available here. The
              input field below will autocomplete on our current database of journal names, allowing you to type
              "Astrophysical Journal", for instance, to find the bibstem "ApJ".
            </div>
            <Form method="POST" action={apiUrl} className="grid gap-x-4 grid-cols-6 mt-1 pt-2 px-2 border-t">
              {/* Bibstem picker */}
              <div className="col-span-6">
                {process.browser ? (
                  <BibstemPickerSingle name="bibstem" onItemUpdate={handleBibstemUpdate} />
                ) : (
                  <TextInput name="bibstem" label="Publication" />
                )}
              </div>
              <div className="col-span-2 mt-2">
                <Field name="year" as={TextInput} label="Year" />
                <ErrorMessage name="year" component="div" />
              </div>
              <div className="col-span-2 mt-2">
                <Field name="volume" as={TextInput} label="Volume" />
                <ErrorMessage name="volume" component="div" />
              </div>
              <div className="col-span-2 mt-2">
                <Field name="page" as={TextInput} label="Page / ID" />
                <ErrorMessage name="page" component="div" />
              </div>
              <Button size="sm" className="mt-3" disabled={isSubmitting} type="submit">
                Search
              </Button>
              <Button variant="link" className="mt-3" onClick={handleReset}>
                Reset
              </Button>
            </Form>
          </section>
        );
      }}
    </Formik>
  );
};

const ReferenceQueryForm = () => {
  const apiUrl = `/api/paperform/${PaperFormType.REFERENCE_QUERY}`;
  return (
    <Formik<PaperFormState[PaperFormType.REFERENCE_QUERY]>
      initialValues={{ reference: '' }}
      onSubmit={async (values, { setSubmitting }) => {
        console.log(values);
        const response = await axios({
          url: apiUrl,
          method: 'POST',
          data: qs.stringify(values, { indices: false }),
        });

        console.log('response', response);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, handleReset }) => (
        <section className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md" aria-labelledby="form-title">
          <h2 className="text-gray-900 text-lg font-medium leading-6" id="journal-search-form">
            Reference Query
          </h2>
          <Form
            method="POST"
            action={`/api/paperform/${PaperFormType.REFERENCE_QUERY}`}
            className="grid gap-x-4 grid-cols-6 mt-1 pt-2 px-2 border-t"
          >
            <div className="col-span-6 mt-3">
              <Field
                name="reference"
                as={TextInput}
                label="Reference"
                helptext={`Enter a full reference string (eg Smith et al 2000, A&A 362, pp. 333-341)`}
              />
              <ErrorMessage name="reference" component="div" />
            </div>
            <Button size="sm" className="mt-3" disabled={isSubmitting} type="submit">
              Search
            </Button>
            <Button variant="link" className="mt-3" onClick={handleReset}>
              Reset
            </Button>
          </Form>
        </section>
      )}
    </Formik>
  );
};

const BibcodeQueryForm = () => {
  const apiUrl = `/api/paperform/${PaperFormType.BIBCODE_QUERY}`;
  return (
    <Formik<PaperFormState[PaperFormType.BIBCODE_QUERY]>
      initialValues={{ bibcodes: '' }}
      onSubmit={async (values, { setSubmitting }) => {
        console.log(values);
        const response = await axios({
          url: apiUrl,
          method: 'POST',
          data: qs.stringify(values, { indices: false }),
        });

        console.log('response', response);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, handleReset }) => (
        <section className="col-span-6 px-2 py-4 bg-gray-100 shadow sm:rounded-md" aria-labelledby="form-title">
          <h2 className="text-gray-900 text-lg font-medium leading-6" id="journal-search-form">
            Bibliographic Code Query
          </h2>
          <Form
            method="POST"
            action={`/api/paperform/${PaperFormType.BIBCODE_QUERY}`}
            className="grid gap-x-4 grid-cols-6 mt-1 pt-2 px-2 border-t"
          >
            <div className="col-span-6 mt-3">
              <label htmlFor="bibcodes" className="block text-gray-700 text-sm font-bold">
                List of Bibcodes
              </label>
              <div className="mt-1">
                <Field
                  as="textarea"
                  name="bibcodes"
                  id="bibcodes"
                  className="block w-full border border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm"
                />
                <ErrorMessage name="bibcodes" component="div" />
                <div className="prose-sm prose text-gray-500">
                  Enter list of Bibcodes (e.g. 1989ApJ...342L..71R), one per line.
                </div>
              </div>
            </div>
            <Button size="sm" className="mt-3" disabled={isSubmitting} type="submit">
              Search
            </Button>
            <Button variant="link" className="mt-3" onClick={handleReset}>
              Reset
            </Button>
          </Form>
        </section>
      )}
    </Formik>
  );
};
