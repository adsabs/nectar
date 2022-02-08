import { useStore } from '@store';
import Downshift, { ControllerStateAndHelpers, StateChangeOptions } from 'downshift';
import { ReactElement, useEffect, useRef } from 'react';
import { SearchInput } from './SearchInput';
import { TypeaheadMenu } from './TypeaheadMenu';
import { TypeaheadOption } from './types';

export interface ISearchBarProps {
  isLoading?: boolean;
}

export const SearchBar = (props: ISearchBarProps): ReactElement => {
  const { isLoading = false } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const { q: query } = useStore((state) => state.query);
  const updateStoreQuery = useStore((state) => state.updateQuery);
  const updateQuery = (q: string) => updateStoreQuery({ q });

  useEffect(() => {
    // check for quote or paren and move cursor back one space to be inside
    // do this on every update to query
    if (/(\w|")["\)]$/.exec(inputRef.current.value)) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len - 1, len - 1);
    }
  }, [query]);

  /**
   * State change handler
   *
   * We will check for input changes and call our prop handler, and keep track of a query value
   */
  const onStateChange = (
    { type, inputValue }: StateChangeOptions<TypeaheadOption>,
    { setState }: ControllerStateAndHelpers<TypeaheadOption>,
  ) => {
    if (type === Downshift.stateChangeTypes.changeInput) {
      updateQuery(inputValue);
    }

    // In the case we blur, close the menu and make sure that the query is not wiped out
    if (type === Downshift.stateChangeTypes.mouseUp || type === Downshift.stateChangeTypes.blurInput) {
      setState({ isOpen: false, inputValue: query });
    }
  };

  // on clear button press, clear query and focus
  const handleClear = () => {
    updateQuery('');
    inputRef.current.focus();
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

    inputRef.current.value = alterQuery(query, selectedItem);
    updateQuery(inputRef.current.value);
    setState({ selectedItem: null });
  };

  // update query to add the new item on the end, instead of clearing
  // const itemToString = (item: TypeaheadOption) => alterQuery(query, item);

  return (
    <Downshift<TypeaheadOption>
      itemToString={() => ''}
      onStateChange={onStateChange}
      initialInputValue={query}
      inputValue={query}
      onSelect={handleItemSelected}
      initialIsOpen={false}
      labelId="searchbar-label"
      menuId="searchbar-menu"
      inputId="searchbar"
    >
      {(dsProps) => {
        const { getLabelProps } = dsProps;

        return (
          <section>
            <label {...getLabelProps()} className="sr-only">
              Search
            </label>
            <SearchInput {...dsProps} ref={inputRef} isLoading={isLoading} handleClear={handleClear} />
            <TypeaheadMenu {...dsProps} />
          </section>
        );
      }}
    </Downshift>
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
