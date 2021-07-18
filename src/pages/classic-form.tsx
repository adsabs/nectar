import { BibstemPicker, Button, Sort, TextInput } from '@components';
import { ClassicformController, RawClassicFormParams } from '@controllers/classicformController';
import clsx from 'clsx';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useReducer } from 'react';

interface FormEvent {
  name: string;
  value: string;
}
const formReducer = (state: Record<string, string>, event: FormEvent) => {
  return {
    ...state,
    [event.name]: event.value,
  };
};

const ClassicForm: NextPage = () => {
  const Router = useRouter();
  const [formData, setFormData] = useReducer(formReducer, {});
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;

    setFormData({ name, value });
  };
  const handleOnSubmit = (e: React.ChangeEvent<HTMLFormElement>): void => {
    e.preventDefault();

    console.log('formData', formData);
    const controller = new ClassicformController(formData as RawClassicFormParams);
    console.log({ query: controller.getQuery() });
    // void Router.push(`/search?${controller.getQuery()}`);
  };

  return (
    <section aria-labelledby="form-title">
      <form
        method="post"
        action="/api/classicform"
        className="grid grid-cols-6 gap-6 px-4 py-8 mx-auto my-8 bg-white shadow sm:rounded-lg lg:max-w-3xl"
        onSubmit={handleOnSubmit}
      >
        <h2 className="sr-only" id="form-title">
          Classic Form
        </h2>
        <fieldset className="col-span-6">
          <legend className="block pb-3 text-sm font-bold text-gray-700">Limit Query</legend>
          <div className="flex justify-between gap-4 mt-1 sm:col-span-2 sm:justify-start sm:mt-0">
            <Checkbox label="Astronomy" checked idPrefix="limit" onChange={handleChange} />
            <Checkbox label="Physics" idPrefix="limit" onChange={handleChange} />
            <Checkbox label="General" idPrefix="limit" onChange={handleChange} />
          </div>
        </fieldset>
        <div className="col-span-6 sm:col-span-3">
          <LogicAndTextarea
            label="Author"
            desc="Author names, enter (Last, First M) one per line"
            onChange={handleChange}
          />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <LogicAndTextarea label="Object" desc="SIMBAD object search (one per line)" onChange={handleChange} />
        </div>
        <div className="col-span-3">
          <TextInput
            label="Publication date start (YYYY/MM)"
            name="pubdate_start"
            placeholder="YYYY/MM"
            onChange={handleChange}
          />
        </div>
        <div className="col-span-3">
          <TextInput
            label="Publication date end (YYYY/MM)"
            name="pubdate_end"
            placeholder="YYYY/MM"
            onChange={handleChange}
          />
        </div>
        <div className="col-span-6">
          <LogicAndInput label="Title" onChange={handleChange} />
        </div>
        <div className="col-span-6">
          <LogicAndInput label="Abstract / Keywords" onChange={handleChange} />
        </div>

        <fieldset className="col-span-6">
          <legend className="sr-only">Property</legend>
          <div className="flex justify-between gap-4 mt-1 sm:col-span-2 sm:justify-start sm:mt-0">
            <Checkbox label="Refereed only" idPrefix="property" bold onChange={handleChange} />
            <Checkbox label="Physics" idPrefix="property" bold onChange={handleChange} />
          </div>
        </fieldset>
        <div className="col-span-6">
          {process.browser ? (
            <BibstemPicker />
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
        <div className="col-span-6">
          <Sort name="sort" />
        </div>
        <div className="col-span-6 md:col-span-1">
          <Button>Submit</Button>
        </div>
      </form>
    </section>
  );
};

const LogicAndTextarea = ({
  label,
  desc,
  onChange,
}: {
  label: string;
  desc: string;
  onChange: React.ChangeEventHandler;
}) => {
  const id = normalizeString(label);
  return (
    <div>
      <div className="flex">
        <label htmlFor={id} className="flex-1 block text-sm font-bold text-gray-700">
          {label}
        </label>
        <LogicRadios name={id} variant="andor" onChange={onChange} />
      </div>
      <div className="mt-1">
        <textarea
          id={id}
          name={id}
          rows={3}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          defaultValue={''}
          onChange={onChange}
        />
      </div>
      <p className="mt-2 text-sm text-gray-500">{desc}</p>
    </div>
  );
};

const Checkbox = ({
  label,
  checked,
  idPrefix,
  bold,
  onChange,
}: {
  idPrefix: string;
  label: string;
  checked?: boolean;
  bold?: boolean;
  onChange: React.ChangeEventHandler;
}) => {
  const labelStyles = clsx({ 'font-bold': bold }, 'text-gray-700');
  const id = `${idPrefix}_${normalizeString(label)}`;
  return (
    <div className="relative flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={id}
          name={id}
          defaultChecked={checked}
          onChange={onChange}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className={labelStyles}>
          {label}
        </label>
      </div>
    </div>
  );
};

const LogicAndInput = ({
  label,
  noLogic,
  onChange,
}: {
  label: string;
  noLogic?: boolean;
  onChange: React.ChangeEventHandler;
}) => {
  const id = normalizeString(label);
  return (
    <div>
      <div className="flex">
        <label htmlFor={id} className="flex-1 block text-sm font-bold text-gray-700">
          {label}
        </label>
        {!noLogic && <LogicRadios name={normalizeString(label)} variant="all" onChange={onChange} />}
      </div>
      <div className="mt-1">
        <input
          type="text"
          id={id}
          name={id}
          onChange={onChange}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          defaultValue={''}
        />
      </div>
    </div>
  );
};

const LogicRadios = ({
  name,
  variant = 'andor',
  onChange,
}: {
  name: string;
  variant: 'andor' | 'all';
  onChange: React.ChangeEventHandler;
}) => {
  const values = {
    andor: ['and', 'or'],
    all: ['and', 'or', 'boolean'],
  };
  const normalizedName = normalizeString(name);

  return (
    <>
      <div className="relative flex flex-col sm:flex-row md:space-x-3">
        {values[variant].map((id) => {
          const fullId = `logic_${normalizedName}_${id}`;
          return (
            <div key={id}>
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  id={fullId}
                  value={id}
                  name={`logic_${name}`}
                  defaultChecked={'and' === id}
                  onChange={onChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500"
                />

                <div className="ml-3 text-sm">
                  <label htmlFor={fullId} className="text-gray-700 uppercase">
                    {id}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

/**
 * Takes in raw string and replaces non-word characters with underscores
 * and lowercases entire string
 * @param {string} raw string to be normalized
 * @returns {string} normalized string
 */
const normalizeString = (raw: string) => raw.replace(/\W+/g, '_').toLowerCase().trim();

export default ClassicForm;
