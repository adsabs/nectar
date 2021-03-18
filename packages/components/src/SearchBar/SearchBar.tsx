import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SearchMachine } from '@nectar/context';
import { useMachine } from '@xstate/react';
import clsx from 'clsx';
import React from 'react';

interface ISearchBarProps {
  query?: string;
}

export const SearchBar = (props: ISearchBarProps): React.ReactElement => {
  const { query = '' } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState<string>(query);

  const [current, send] = useMachine(SearchMachine);

  const clearBtnCls = clsx(
    { hidden: query?.length === 0, block: query?.length > 0 },
    'absolute inset-y-0 right-20 flex items-center',
  );

  const handleClear = React.useCallback(() => {
    inputRef?.current?.focus();
  }, [inputRef]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
  };

  React.useEffect(() => {
    send({
      type: 'SET_PARAMS',
      payload: { params: { q: value } },
    });
  }, [value]);

  const { context, value: state } = current;
  return (
    <div>
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <code>{JSON.stringify({ context, state }, null, 2)}</code>
      <div className="mt-1 relative rounded-md shadow-md">
        <input
          type="text"
          className="form-input block w-full h-12 pl-2 pr-28 text-sm sm:leading-5 md:text-lg"
          name="q"
          placeholder="Search"
          ref={inputRef}
          onChange={handleChange}
          value={value}
        />
        <div className={clearBtnCls}>
          <button
            type="button"
            className="text-gray-700 text-2xl font-bold px-3 h-10 rounded hover:bg-grey-300"
            onClick={handleClear}
            aria-label="clear search"
            title="clear search"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="absolute inset-y-0 right-1 flex items-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold h-10 px-7 border border-blue-700 rounded"
            aria-label="submit search"
            title="submit search"
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
      </div>
    </div>
  );
};
