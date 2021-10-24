import Downshift, { ControllerStateAndHelpers, StateChangeOptions } from 'downshift';
import PT from 'prop-types';
import { ReactElement, useRef, useState } from 'react';
import { SearchInput } from './SearchInput';
import { TypeaheadMenu } from './TypeaheadMenu';
import { TypeaheadOption } from './types';

export interface ISearchBarProps {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  isLoading?: boolean;
}
const defaultProps = {
  initialQuery: '',
  isLoading: false,
};

const propTypes = {
  initialQuery: PT.string,
  isLoading: PT.bool,
  onQueryChange: PT.func,
};

export const SearchBar = (props: ISearchBarProps): ReactElement => {
  const { initialQuery, onQueryChange, isLoading } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);

  /**
   * State change handler
   *
   * We will check for input changes and call our prop handler, and keep track of a query value
   */
  const onStateChange = (
    { type, inputValue }: StateChangeOptions<TypeaheadOption>,
    { setState }: ControllerStateAndHelpers<TypeaheadOption>,
  ) => {
    // on input change, update the query, and call our handler
    if (type === Downshift.stateChangeTypes.changeInput) {
      if (typeof onQueryChange === 'function') {
        onQueryChange(inputValue);
      }
      setQuery(inputValue);
      setState({ inputValue });
    }

    // In the case we blur, close the menu and make sure that the query is not wiped out
    if (type === Downshift.stateChangeTypes.mouseUp || type === Downshift.stateChangeTypes.blurInput) {
      setState({ isOpen: false, inputValue: query });
    }
  };

  /**
   * Item selection handler
   *
   * When an item is selected, check if we need to move the cursor
   * Also clear the selection, since are overriding the default (single selection)
   */
  const handleItemSelected = (
    selectedItem: TypeaheadOption,
    { setState }: ControllerStateAndHelpers<TypeaheadOption>,
  ) => {
    if (!selectedItem) {
      return;
    }

    // check for quote or paren and move cursor back one space to be inside
    if (/["\)]$/.exec(selectedItem.value)) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len - 1, len - 1);
    }

    setState({ selectedItem: null });
  };

  // update query to add the new item on the end, instead of clearing
  const itemToString = (item: TypeaheadOption) => alterQuery(query, item);

  return (
    <Downshift<TypeaheadOption>
      itemToString={itemToString}
      onStateChange={onStateChange}
      initialInputValue={initialQuery}
      onSelect={handleItemSelected}
      initialIsOpen={false}
    >
      {(dsProps) => {
        const { getLabelProps } = dsProps;

        return (
          <section>
            <label {...getLabelProps()} className="sr-only">
              Search
            </label>
            <SearchInput {...dsProps} ref={inputRef} isLoading={isLoading} />
            <TypeaheadMenu {...dsProps} />
          </section>
        );
      }}
    </Downshift>
  );
};
SearchBar.defaultProps = defaultProps;
SearchBar.propTypes = propTypes;

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
