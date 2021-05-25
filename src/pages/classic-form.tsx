import { BibstemPicker, Button } from '@components';
import clsx from 'clsx';
import { NextPage } from 'next';
import React from 'react';

const ClassicForm: NextPage = () => {
  return (
    <form
      method="post"
      action="/api/classicform"
      className="grid gap-6 grid-cols-6 mx-auto my-4 px-4 py-12 lg:max-w-3xl"
    >
      <h2 className="sr-only">Classic Form</h2>
      <fieldset className="col-span-6">
        <legend className="block pb-3 text-gray-700 text-sm font-bold">
          Limit Query
        </legend>
        <div className="flex gap-4 mt-1 sm:col-span-2 sm:mt-0">
          <Checkbox label="Astronomy" checked idPrefix="limit" />
          <Checkbox label="Physics" idPrefix="limit" />
          <Checkbox label="General" idPrefix="limit" />
        </div>
      </fieldset>
      <div className="col-span-6 sm:col-span-3">
        <LogicAndTextarea
          label="Author"
          desc="Author names, enter (Last, First M) one per line"
        />
      </div>
      <div className="col-span-6 sm:col-span-3">
        <LogicAndTextarea
          label="Object"
          desc="SIMBAD object search (one per line)"
        />
      </div>
      <div className="col-span-6">
        <LogicAndInput label="Title" />
      </div>
      <div className="col-span-6">
        <LogicAndInput label="Abstract / Keywords" />
      </div>

      <fieldset className="col-span-6">
        <legend className="sr-only">Property</legend>
        <div className="flex gap-4 mt-1 sm:col-span-2 sm:mt-0">
          <Checkbox label="Refereed only" idPrefix="property" bold />
          <Checkbox label="Physics" idPrefix="property" bold />
        </div>
      </fieldset>
      <div className="col-span-6">
        <BibstemPicker />
      </div>
      <div className="col-span-6 md:col-span-1">
        <Button>Submit</Button>
      </div>
    </form>
  );
};

const LogicAndTextarea = ({ label, desc }: { label: string; desc: string }) => {
  const id = normalizeString(label);
  return (
    <div>
      <div className="flex">
        <label
          htmlFor={id}
          className="block flex-1 text-gray-700 text-sm font-bold"
        >
          {label}
        </label>
        <LogicRadios name={id} variant="andor" />
      </div>
      <div className="mt-1">
        <textarea
          id={id}
          name={id}
          rows={3}
          className="block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm"
          defaultValue={''}
        />
      </div>
      <p className="mt-2 text-gray-500 text-sm">{desc}</p>
    </div>
  );
};

const Checkbox = ({
  label,
  checked,
  idPrefix,
  bold,
}: {
  idPrefix: string;
  label: string;
  checked?: boolean;
  bold?: boolean;
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
}: {
  label: string;
  noLogic?: boolean;
}) => {
  const id = normalizeString(label);
  return (
    <div>
      <div className="flex">
        <label
          htmlFor={id}
          className="block flex-1 text-gray-700 text-sm font-bold"
        >
          {label}
        </label>
        {!noLogic && (
          <LogicRadios name={normalizeString(label)} variant="all" />
        )}
      </div>
      <div className="mt-1">
        <input
          type="text"
          id={id}
          name={id}
          className="block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm"
          defaultValue={''}
        />
      </div>
    </div>
  );
};

const LogicRadios = ({
  name,
  variant = 'andor',
}: {
  name: string;
  variant: 'andor' | 'all';
}) => {
  const values = {
    andor: ['and', 'or'],
    all: ['and', 'or', 'boolean'],
  };
  const normalizedName = normalizeString(name);

  return (
    <>
      <div className="relative flex flex-col sm:flex-row md:space-x-3">
        {values[variant].map((id) => (
          <div key={id}>
            <div className="flex items-center h-5">
              <input
                type="radio"
                id={`logic_${normalizedName}_${id}`}
                name={`logic_${name}`}
                defaultChecked={'and' === id}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500"
              />

              <div className="ml-3 text-sm">
                <label
                  htmlFor={`logic_${normalizedName}_${id}`}
                  className="text-gray-700 uppercase"
                >
                  {id}
                </label>
              </div>
            </div>
          </div>
        ))}
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
const normalizeString = (raw: string) =>
  raw.replace(/\W+/g, '_').toLowerCase().trim();

export default ClassicForm;
