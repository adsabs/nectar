import { SearchIcon, XIcon } from '@heroicons/react/solid';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import clsx from 'clsx';
import Downshift, { ControllerStateAndHelpers, StateChangeOptions } from 'downshift';
import { compose, filter, uniqBy } from 'ramda';
import React, { useEffect, useMemo } from 'react';
import { TypeaheadOption, typeaheadOptions } from './types';
export interface ISearchBarProps {
  isLoading?: boolean;
  service: ISearchMachine;
}

const useQuery = (searchService: ISearchMachine): [string, (query: string) => void] => {
  const query = useSelector(searchService, (state) => state.context.params.q);
  const setQuery = (query: string) => {
    searchService.send(TransitionType.SET_PARAMS, { payload: { params: { q: query } } });
  };
  return [query, setQuery];
};

export const SearchBar = (props: ISearchBarProps): React.ReactElement => {
  const { service: searchService } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = useQuery(searchService);

  const handleSelection = (item: TypeaheadOption, state: ControllerStateAndHelpers<TypeaheadOption>) => {
    if (!item) {
      return;
    }

    // check for quote or paren and move cursor back one space to be inside
    if (/["\)]$/.exec(item.value)) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len - 1, len - 1);
    }

    state.setState({ selectedItem: null });
  };

  interface ITypeaheadState extends Partial<StateChangeOptions<TypeaheadOption>> {
    flag?: boolean;
  }
  const typeaheadStateReducer = (
    state: ITypeaheadState,
    { type, ...changes }: StateChangeOptions<TypeaheadOption>,
  ): ITypeaheadState => {
    if (type === Downshift.stateChangeTypes.changeInput) {
      const { inputValue } = changes;
      setQuery(inputValue);

      // check if last character is bracker or quote
      if (/[\[\"]$/.exec(inputValue)) {
        // in this case, we want to set our flag so we ignore spaces
        return { ...state, inputValue, flag: !state.flag };
      }

      // check for non-whitespace final character
      if (inputValue.length > 0 && /^\S+|\s+\S+$/.exec(inputValue) && !state.flag) {
        // we can open the menu again
        return {
          ...state,
          isOpen: true,
          inputValue,
        };
      }
    }

    // ignore mouseup,blur -- these will clear the input unexpectedly
    if (type === Downshift.stateChangeTypes.mouseUp || type === Downshift.stateChangeTypes.blurInput) {
      return { ...state, isOpen: false };
    }

    return changes;
  };

  // alter the outgoing string after selection, to append to query
  const itemToString = (item: TypeaheadOption) => {
    const updatedQuery = alterQuery(query, item);
    setQuery(updatedQuery);
    return updatedQuery;
  };

  return (
    <>
      <Downshift<TypeaheadOption>
        itemToString={itemToString}
        stateReducer={typeaheadStateReducer}
        onSelect={handleSelection}
        inputValue={query}
        defaultIsOpen={false}
      >
        {(dsProps) => {
          return (
            <div>
              <Label {...dsProps} />
              <Input {...dsProps} ref={inputRef} />
              <Menu {...dsProps} />
            </div>
          );
        }}
      </Downshift>
    </>
  );
};

const Input = React.forwardRef<HTMLInputElement, ControllerStateAndHelpers<TypeaheadOption>>((props, ref) => {
  const { getRootProps, getInputProps } = props;
  const inputProps = getInputProps();

  // clear button logic, we watch on the current inputvalue
  const [showClearBtn, setShowClearBtn] = React.useState(false);
  const value = inputProps.value as string;
  useEffect(() => setShowClearBtn(value && value.length > 0), [value]);
  const handleClear = () => props.reset({ inputValue: '' });

  return (
    <div {...getRootProps()}>
      <div className="flex mt-1 rounded-md shadow-sm">
        <div className="relative focus-within:z-10 flex flex-grow items-stretch">
          <input
            type="text"
            name="q"
            {...inputProps}
            ref={ref}
            className="block pl-2 w-full border-r-0 focus:border-r-2 border-gray-300 focus:border-indigo-500 rounded-l-md rounded-none focus:ring-indigo-500 sm:text-sm"
            placeholder="Search"
          />
          {showClearBtn && (
            <button
              type="button"
              onClick={handleClear}
              className="flex-end px-3 py-2 text-lg border-b border-t border-gray-300"
            >
              <XIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        <button className="relative inline-flex items-center -ml-px px-4 py-2 text-sm font-medium hover:bg-blue-500 bg-blue-600 border focus:border-blue-500 border-blue-600 rounded-r-md focus:outline-none space-x-2 focus:ring-1 focus:ring-blue-500">
          <SearchIcon className="w-5 h-5 text-white" aria-hidden="true" />
          <span className="sr-only">Search</span>
        </button>
      </div>
    </div>
  );
});

const Label = (props: ControllerStateAndHelpers<TypeaheadOption>) => {
  const { getLabelProps } = props;

  return (
    <label {...getLabelProps()} className="sr-only">
      Search
    </label>
  );
};

const Menu = (props: ControllerStateAndHelpers<TypeaheadOption>) => {
  const { getItemProps, getMenuProps, isOpen, inputValue, highlightedIndex, selectedItem } = props;

  const renderItem = (item: TypeaheadOption, index: number): React.ReactElement => {
    const itemCls = clsx(
      {
        'bg-gray-300': selectedItem === item,
        'font-bold bg-gray-100': highlightedIndex === index,
      },
      'px-1 py-0.5 cursor-pointer',
    );

    return (
      <li
        {...getItemProps({
          key: item.value + index.toString(),
          index,
          item,
        })}
        className={itemCls}
      >
        <span className="flex space-x-1">
          <div>{item.label}</div>
          <div>({item.value})</div>
        </span>
      </li>
    );
  };

  const options = useMemo(() => filterOptions(inputValue), [inputValue, filterOptions]);
  const renderList = () => {
    return options.length > 0 ? (
      <div className="absolute left-1 mt-1 w-full bg-white rounded-b-sm focus:outline-none shadow-md divide-gray-100 divide-y-2 origin-top-right ring-1 ring-black ring-opacity-5">
        {options.map(renderItem)}
      </div>
    ) : null;
  };

  return (
    <div className="relative">
      <ul {...getMenuProps()}>{isOpen ? renderList() : null}</ul>
    </div>
  );
};

/**
 * Takes in current query string an a value that will be added
 * it replaces the final non-whitespace characters with the passed in string
 *
 * @param {string} query the current query value
 * @param {TypeaheadOption} item the string that will be added to the end of the query
 * @returns {string} updated query
 */
const alterQuery = (query: string, item: TypeaheadOption): string => {
  // look for non-whitespace chars at the end of the string
  const res = /(\S+)$/.exec(query);
  const valueToAdd = item === null ? '' : item.value;

  // if no match, just return the new value
  if (res === null) {
    return valueToAdd || '';
  }

  // then replace those characters with the valueToAdd
  return query.slice(0, -res[0].length) + valueToAdd;
};

/**
 * Takes raw input value and returns a set of filtered results
 * @param {string} rawValue raw input value
 * @returns {TypeaheadOption[]} set of filtered results
 */
const filterOptions = (rawValue: string): TypeaheadOption[] => {
  const res = /(\S+$)/g.exec(rawValue);
  const value = res === null ? rawValue : res[0].trim();

  return compose(
    // remove duplicates
    uniqBy((item: TypeaheadOption) => item.value),

    // filter on all text inside item (this may not be wanted)
    filter<TypeaheadOption, 'array'>(
      (item: TypeaheadOption) =>
        (value && item.match.includes(value)) || item.desc.includes(value) || item.label.includes(value),
    ),
  )(typeaheadOptions);
};
