import { SolrSort } from '@api';
import { BibstemPickerMultiple, Button, Sort, TextInput } from '@components';
import { isBrowser } from '@utils';
import clsx from 'clsx';
import { NextPage } from 'next';
import { ChangeEvent, ChangeEventHandler, useCallback, useReducer } from 'react';

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
  // const Router = useRouter();
  const [, setFormData] = useReducer(formReducer, {});
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData({ name, value });
  };
  const handleSortChange = useCallback(
    (sort: SolrSort[]) => {
      setFormData({ name: 'sort', value: sort.join(',') });
    },
    [setFormData],
  );
  // const handleOnSubmit = (e: ChangeEvent<HTMLFormElement>): void => {
  //   e.preventDefault();
  //   const controller = new ClassicformController(formData as RawClassicFormParams);
  //   void Router.push(`/search?${controller.getQuery()}`);
  // };

  return (
    <section aria-labelledby="form-title">
      <form
        method="post"
        action="/api/classicform"
        className="grid gap-6 grid-cols-6 mx-auto my-8 px-4 py-8 lg:max-w-3xl"
      >
        <h2 className="sr-only" id="form-title">
          Classic Form
        </h2>
        <fieldset className="col-span-6">
          <legend className="block pb-3 text-gray-700 text-sm font-bold">Limit Query</legend>
          <div className="flex gap-4 justify-between mt-1 sm:col-span-2 sm:justify-start sm:mt-0">
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
          <div className="flex gap-4 justify-between mt-1 sm:col-span-2 sm:justify-start sm:mt-0">
            <Checkbox label="Refereed only" idPrefix="property" bold onChange={handleChange} />
            <Checkbox label="Physics" idPrefix="property" bold onChange={handleChange} />
          </div>
        </fieldset>
        <div className="col-span-6">
          {isBrowser() ? (
            <BibstemPickerMultiple />
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
          <Sort name="sort" onChange={handleSortChange} />
        </div>
        <div className="col-span-6 md:col-span-1">
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </section>
  );
};

const LogicAndTextarea = ({ label, desc, onChange }: { label: string; desc: string; onChange: ChangeEventHandler }) => {
  const id = normalizeString(label);
  return (
    <div>
      <div className="flex">
        <label htmlFor={id} className="block flex-1 text-gray-700 text-sm font-bold">
          {label}
        </label>
        <LogicRadios name={id} variant="andor" onChange={onChange} />
      </div>
      <div className="mt-1">
        <textarea
          id={id}
          name={id}
          rows={3}
          className="block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm"
          defaultValue={''}
          onChange={onChange}
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
  onChange,
}: {
  idPrefix: string;
  label: string;
  checked?: boolean;
  bold?: boolean;
  onChange: ChangeEventHandler;
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
  onChange: ChangeEventHandler;
}) => {
  const id = normalizeString(label);
  return (
    <div>
      <div className="flex">
        <label htmlFor={id} className="block flex-1 text-gray-700 text-sm font-bold">
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
  onChange,
}: {
  name: string;
  variant: 'andor' | 'all';
  onChange: ChangeEventHandler;
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
