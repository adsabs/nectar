import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import Downshift, {
  ControllerStateAndHelpers,
  StateChangeOptions,
} from 'downshift';
import { compose, filter, uniqBy } from 'ramda';
import React from 'react';
import { TypeaheadOption, typeaheadOptions } from './types';
export interface ISearchBarProps {
  initialQuery?: string;
  onChange?: (value: string) => void;
}

export const SearchBar = (props: ISearchBarProps): React.ReactElement => {
  const { initialQuery = '', onChange } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState(initialQuery);

  // call the passed in handler upon input change
  React.useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(query);
    }
  }, [onChange, query]);

  const handleSelection = (
    item: TypeaheadOption,
    state: ControllerStateAndHelpers<TypeaheadOption>,
  ) => {
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

  interface ITypeaheadState
    extends Partial<StateChangeOptions<TypeaheadOption>> {
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
      if (/^\S+|\s+\S+$/.exec(inputValue) && !state.flag) {
        // we can open the menu again
        return {
          ...state,
          isOpen: true,
          inputValue,
        };
      }
    }

    return changes;
  };

  // alter the outgoing string after selection, to append to query
  const itemToString = (item: TypeaheadOption) =>
    alterQuery(query, item && item.value);

  return (
    <>
      <Downshift<TypeaheadOption>
        itemToString={itemToString}
        stateReducer={typeaheadStateReducer}
        onSelect={handleSelection}
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

const Input = React.forwardRef<
  HTMLInputElement,
  ControllerStateAndHelpers<TypeaheadOption>
>((props, ref) => {
  const { getRootProps, getInputProps } = props;
  const inputProps = getInputProps();

  // clear button logic, we watch on the current inputvalue
  const [showClearBtn, setShowClearBtn] = React.useState(false);
  const value = inputProps.value as string;
  React.useEffect(() => setShowClearBtn(value && value.length > 0), [value]);
  const handleClear = () => props.reset({ inputValue: '' });

  return (
    <div className="flex space-x-1" {...getRootProps({ refKey: 'ref' })}>
      <input
        type="text"
        name="q"
        {...inputProps}
        ref={ref}
        className="form-input flex-1 py-2 rounded-md ring-0"
        placeholder="Search"
      />
      {showClearBtn && (
        <div className="relative">
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 px-3 py-2 text-lg"
          >
            <FontAwesomeIcon fixedWidth icon={faTimes} />
          </button>
        </div>
      )}
      <button
        type="submit"
        className="px-3 py-2 text-white bg-blue-500 rounded-md"
      >
        <FontAwesomeIcon icon={faSearch} />{' '}
        <span className="sr-only">Search</span>
      </button>
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
  const {
    getItemProps,
    getMenuProps,
    isOpen,
    inputValue,
    highlightedIndex,
    selectedItem,
  } = props;

  const renderItem = (
    item: TypeaheadOption,
    index: number,
  ): React.ReactElement => {
    const itemCls = clsx(
      {
        'bg-gray-300': selectedItem === item,
        'font-bold bg-gray-100': highlightedIndex === index,
      },
      'px-1',
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
        <span className="flex gap-3">
          <div>{item.label}</div>
          <div>({item.value})</div>
        </span>
      </li>
    );
  };

  return (
    <div className="relative z-10">
      <ul {...getMenuProps()} className="relative shadow-md">
        {isOpen ? filterOptions(inputValue).map(renderItem) : null}
      </ul>
    </div>
  );
};

/**
 * Takes in current query string an a value that will be added
 * it replaces the final non-whitespace characters with the passed in string
 *
 * @param {string} query the current query value
 * @param {string} valueToAdd the string that will be added to the end of the query
 * @returns {string} updated query
 */
const alterQuery = (query: string, valueToAdd: string): string => {
  // look for non-whitespace chars at the end of the string
  const res = /(\S+)$/.exec(query);

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
        (value && item.match.includes(value)) ||
        item.desc.includes(value) ||
        item.label.includes(value),
    ),
  )(typeaheadOptions);
};
