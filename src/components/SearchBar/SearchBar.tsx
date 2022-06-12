import { SearchIcon } from '@chakra-ui/icons';
import {
  Button,
  CloseButton,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
  Spinner,
  Text,
  usePopper,
  VisuallyHidden,
  visuallyHiddenStyle,
  VStack,
} from '@chakra-ui/react';
import { useIsClient } from '@hooks/useIsClient';
import { useStore } from '@store';
import { useCombobox } from 'downshift';
import { matchSorter } from 'match-sorter';
import { last } from 'ramda';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { typeaheadOptions } from './models';
import { QuickFields } from './QuickFields';
import { TypeaheadOption } from './types';

/**
 * Takes raw input value and returns a set of filtered results
 * @param {string} rawValue raw input value
 * @returns {TypeaheadOption[]} set of filtered results
 */
const filterOptions = (rawValue: string): TypeaheadOption[] => {
  if (/\s+$/.exec(rawValue)) {
    return [];
  }

  const fields = rawValue.match(/(?:[^\s"]+|"[^"]*")+/g);
  const term = fields === null ? rawValue : last(fields);
  return matchSorter(typeaheadOptions, term, { keys: ['match'], threshold: matchSorter.rankings.WORD_STARTS_WITH });
};

export interface ISearchBarProps {
  isLoading?: boolean;
}

export const SearchBar = forwardRef<Partial<HTMLInputElement>, ISearchBarProps>((props, ref) => {
  const query = useStore((state) => state.query.q);
  const updateStoreQuery = useStore((state) => state.updateQuery);
  const updateQuery = (q: string) => updateStoreQuery({ q });
  const input = useRef<HTMLInputElement>(null);
  const isClient = useIsClient();

  // allow outside refs to fire focus
  useImperativeHandle(ref, () => ({
    focus: () => input.current.focus(),
  }));

  const fixCursor = (newInputValue: string) => {
    if (/[\)"]/.test(last(newInputValue))) {
      setTimeout(() => {
        input.current.setSelectionRange(newInputValue.length - 1, newInputValue.length - 1);
      }, 0);
    }
  };

  const [inputItems, setInputItems] = useState(typeaheadOptions);
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    reset,
    inputValue,
    setInputValue,
    closeMenu,
  } = useCombobox({
    defaultInputValue: query,
    items: inputItems,
    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;

      switch (type) {
        case useCombobox.stateChangeTypes.FunctionReset: {
          updateQuery('');
          return changes;
        }

        case useCombobox.stateChangeTypes.InputBlur:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick: {
          if (state.highlightedIndex === -1) {
            // in the case we aren't actually on an item, do nothing
            return changes;
          }

          const updatedQuery = state.inputValue.replace(/\s*[^\s]+$/g, '');
          const newInputValue =
            updatedQuery + (updatedQuery.length > 0 ? ' ' + changes.inputValue : changes.inputValue);

          // fix cursor
          fixCursor(newInputValue);

          return {
            ...changes,
            inputValue: newInputValue,
          };
        }

        default:
          return changes;
      }
    },
    onInputValueChange: ({ inputValue }) => {
      if (inputValue !== query) {
        updateQuery(inputValue);
      }

      // only suggest if we're at the end of the input
      if (input.current.selectionStart < inputValue.length || inputValue.length === 0) {
        return setInputItems([]);
      }

      setInputItems(filterOptions(inputValue));
    },
    itemToString: (item) => item?.value ?? '',
    labelId: 'primary-search-label',
    menuId: 'primary-search-menu',
    inputId: 'primary-search-input',
    getItemId: (index) => `primary-search-menuitem-${index}`,
  });

  useEffect(() => setInputValue(query), [query]);

  const handleReset = () => {
    reset();
    focus();
  };

  const handleQuickFieldSelection = useCallback(
    (value: string) => {
      // Add our text to the end of the query
      const newInputValue = `${query}${query.length > 0 ? ' ' : ''}${value}`;
      updateQuery(newInputValue);
      fixCursor(newInputValue);
      input.current.focus();
    },
    [query],
  );

  const { popperRef, referenceRef } = usePopper({
    enabled: isOpen,
    matchWidth: true,
    placement: 'bottom-start',
    offset: [0, 3],
  });

  // call focus after component mounts
  useLayoutEffect(() => focus(), []);

  // focus on the search bar, and set the cursor to the end
  const focus = useCallback(() => {
    if (input.current) {
      input.current.focus();
      input.current.selectionStart = Number.MAX_SAFE_INTEGER;
    }
  }, [input.current]);

  return (
    <VStack as="section" direction="column" spacing={2} align="stretch">
      {isClient && <QuickFields onSelect={handleQuickFieldSelection} />}
      <Flex as="section" direction="row" alignItems="center">
        <Flex as="section" direction="column" flexGrow="1">
          <label style={visuallyHiddenStyle} {...getLabelProps()}>
            Search Database
          </label>
          <InputGroup size="xl" {...getComboboxProps()}>
            <Input
              disabled={props.isLoading}
              data-testid="searchbar-input"
              variant="outline"
              placeholder="Search..."
              type="text"
              autoFocus
              name="q"
              {...getInputProps({
                ref: (el: HTMLInputElement) => {
                  referenceRef(el);
                  input.current = el;
                  return el;
                },
                onKeyDown: (e) => {
                  // by default, downshift captures home/end, prevent that here
                  if (e.key === 'Home' || e.key === 'End') {
                    (
                      e.nativeEvent as typeof e.nativeEvent & { preventDownshiftDefault: boolean }
                    ).preventDownshiftDefault = true;
                  }
                  if (e.key === 'Enter') {
                    // on submit, the menu should close
                    setTimeout(() => closeMenu(), 0);
                  }
                },
              })}
              spellCheck="false"
              autoComplete="off"
            />

            {isClient && inputValue.length > 0 && (
              <InputRightElement>
                <CloseButton aria-label="Clear search" size="lg" onClick={handleReset} data-testid="searchbar-clear" />
              </InputRightElement>
            )}
          </InputGroup>

          <List
            backgroundColor="white"
            borderRadius="md"
            borderTopRadius="none"
            boxShadow="lg"
            zIndex="1000"
            data-testid="searchbar-menu"
            {...getMenuProps({
              ref: (el: HTMLUListElement) => {
                popperRef(el);
                return el;
              },
            })}
          >
            {isOpen &&
              inputItems.map((item, index) => (
                <ListItem
                  key={`${item.id}${index}`}
                  {...getItemProps({ item, index })}
                  backgroundColor={highlightedIndex === index ? 'blue.100' : 'auto'}
                  py="2"
                  px="2"
                  cursor="pointer"
                >
                  <Text fontWeight="bold" fontSize="lg">
                    {item.label}
                  </Text>
                  <Text fontSize="sm">{item.desc}</Text>
                </ListItem>
              ))}
          </List>
        </Flex>

        {/* @TODO: fix this magic number */}
        <Button
          type="submit"
          h="40px"
          borderLeftRadius="none"
          data-testid="searchbar-submit"
          isDisabled={props.isLoading}
        >
          {props.isLoading ? (
            <>
              <Spinner />
              <VisuallyHidden>Loading</VisuallyHidden>
            </>
          ) : (
            <>
              <SearchIcon fontSize="xl" aria-hidden />
              <VisuallyHidden>Search</VisuallyHidden>
            </>
          )}
        </Button>
      </Flex>
    </VStack>
  );
});
