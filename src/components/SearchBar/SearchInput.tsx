import { RefreshIcon, SearchIcon, XIcon } from '@heroicons/react/solid';
import { ControllerStateAndHelpers } from 'downshift';
import PT from 'prop-types';
import { forwardRef, useEffect, useState } from 'react';
import { TypeaheadOption } from './types';

export interface ISearchInputProps extends ControllerStateAndHelpers<TypeaheadOption> {
  isLoading: boolean;
}

const defaultProps = {
  isLoading: false,
};
const propTypes = {
  isLoading: PT.bool,
};

export const SearchInput = forwardRef<HTMLInputElement, ISearchInputProps>((props, ref) => {
  const { isLoading, reset, getInputProps, inputValue } = props;
  const [showClearBtn, setShowClearBtn] = useState(typeof inputValue === 'string' ? inputValue.length > 0 : false);
  const handleClear = () => reset({ inputValue: '' });
  useEffect(() => setShowClearBtn(typeof inputValue === 'string' ? inputValue.length > 0 : false), [inputValue]);

  return (
    <section>
      <div className="flex mt-1 rounded-md shadow-sm">
        <div className="relative focus-within:z-10 flex flex-grow items-stretch">
          <input
            type="text"
            name="q"
            {...getInputProps()}
            ref={ref}
            className="block pl-2 w-full border-r-0 focus:border-r-2 border-gray-300 focus:border-indigo-500 rounded-l-md rounded-none focus:ring-indigo-500 sm:text-sm"
            placeholder="Search"
            data-testid="searchbar-input"
          />
          {showClearBtn && (
            <button
              type="button"
              data-testid="searchbar-clear-btn"
              onClick={handleClear}
              className="flex-end px-2 py-2 text-lg border-b border-t border-gray-300"
            >
              <span className="sr-only">clear input</span>
              <XIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          data-testid="searchbar-submit-btn"
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium hover:bg-blue-500 bg-blue-600 border focus:border-blue-500 border-blue-600 rounded-r-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {isLoading ? (
            <>
              <span className="sr-only">Loading</span>
              <RefreshIcon className="w-5 h-5 text-white transform rotate-180 animate-spin" />
            </>
          ) : (
            <>
              <span className="sr-only">Search</span>
              <SearchIcon className="w-5 h-5 text-white" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </section>
  );
});
SearchInput.defaultProps = defaultProps;
SearchInput.propTypes = propTypes;
