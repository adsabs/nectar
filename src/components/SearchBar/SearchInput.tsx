import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonProps,
  CloseButton,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
  Show,
  Spinner,
  Text,
  usePopper,
  VisuallyHidden,
  visuallyHiddenStyle,
} from '@chakra-ui/react';
import { useCombobox, UseComboboxStateChange } from 'downshift';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { typeaheadOptions } from './models';
import { useIntermediateQuery } from '@lib/useIntermediateQuery';
import { isNilOrEmpty } from 'ramda-adjunct';
import { filterItems } from '@components/SearchBar/helpers';
import { TypeaheadOption } from '@components/SearchBar/types';
import { useStore } from '@store';

export interface ISearchInputProps {
  isLoading?: boolean;
}

const ClearInputButton = (props: { onClear: () => void } & ButtonProps) => {
  const { onClear, ...buttonProps } = props;
  const { clearQuery, query } = useIntermediateQuery();

  const handleClear = useCallback(() => {
    clearQuery();
    if (typeof onClear === 'function') {
      onClear();
    }
  }, [clearQuery, onClear]);

  return isNilOrEmpty(query) ? null : (
    <CloseButton
      aria-label="Clear search"
      size="lg"
      onClick={handleClear}
      data-testid="searchbar-clear"
      {...buttonProps}
    />
  );
};

export const SearchInput = forwardRef<Partial<HTMLInputElement>, ISearchInputProps>((props, ref) => {
  const { query, updateQuery, isClearingQuery, onDoneClearingQuery, queryAddition, onDoneAppendingToQuery } =
    useIntermediateQuery();
  const latestQuery = useStore((state) => state.latestQuery.q);
  const input = useRef<HTMLInputElement>(null);

  // allow outside refs to fire focus
  useImperativeHandle(ref, () => ({
    focus: () => input.current.focus(),
    setSelectionRange: (start: number, end: number) => input.current.setSelectionRange(start, end),
  }));

  const [inputItems, setInputItems] = useState(typeaheadOptions);
  const [selectedItem, setSelectedItem] = useState<TypeaheadOption>(null);
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    inputValue,
    closeMenu,
    setInputValue,
  } = useCombobox({
    defaultInputValue: latestQuery,
    items: inputItems,
    itemToString: useCallback<(item: TypeaheadOption) => string>(
      (item) => {
        return item ? `${query.replace(/\S+$/, '')}${item.value}` : query;
      },
      [query],
    ),
    labelId: 'primary-search-label',
    menuId: 'primary-search-menu',
    inputId: 'primary-search-input',
    getItemId: (index) => `primary-search-menuitem-${index}`,
    selectedItem,
    onSelectedItemChange: ({ selectedItem }) => setSelectedItem(selectedItem),
    onInputValueChange: useCallback<(changes: UseComboboxStateChange<TypeaheadOption>) => void>(
      ({ inputValue }) => {
        // update store query, with input value
        if (inputValue !== query) {
          updateQuery(inputValue);
        }
      },
      [updateQuery, query],
    ),
    circularNavigation: false,
  });

  // filter items, but only when the cursor is at the end of the input
  useEffect(() => {
    if (input.current.selectionStart < inputValue.length || inputValue.length === 0) {
      setInputItems([]);
    } else {
      setInputItems(filterItems(inputValue));
    }
  }, [setInputItems, inputValue, filterItems, input.current?.selectionStart]);

  // watch for query addition changes and update the input value
  useEffect(() => {
    if (queryAddition) {
      setInputValue(inputValue.length === 0 ? queryAddition : `${inputValue} ${queryAddition}`);
      onDoneAppendingToQuery();
      focus();
    }
  }, [queryAddition, inputValue, onDoneAppendingToQuery]);

  // watch for query clear flag and clear the input value
  useEffect(() => {
    if (isClearingQuery) {
      setInputValue('');
      onDoneClearingQuery();
      focus();
    }
  }, [isClearingQuery, onDoneClearingQuery]);

  const { popperRef, referenceRef } = usePopper({
    enabled: isOpen,
    matchWidth: true,
    placement: 'bottom-start',
    offset: [0, 3],
  });

  // focus on the search bar, and set the cursor to the end
  const focus = useCallback(() => {
    if (input.current) {
      input.current.focus();
      input.current.selectionStart = Number.MAX_SAFE_INTEGER;
    }
  }, [input.current]);

  // call focus after component mounts
  useEffect(() => {
    if (input?.current?.focus) {
      focus();
    }
  }, [input, focus]);

  return (
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
            height="40px"
            pl="2"
            pr="10"
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

                  (
                    e.nativeEvent as typeof e.nativeEvent & { preventDownshiftDefault: boolean }
                  ).preventDownshiftDefault = true;
                }
              },
            })}
            spellCheck="off"
            autoComplete="off"
            id="primary-search-input"
          />

          <InputRightElement>
            <ClearInputButton onClear={focus} isDisabled={props.isLoading} />
          </InputRightElement>
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
                display="flex"
                alignItems="center"
              >
                <Box flex="1">
                  <Text fontWeight="bold" fontSize={['sm', 'lg']}>
                    {item.label}
                  </Text>
                  <Text fontSize={['xs', 'sm']}>{item.desc}</Text>
                </Box>
                <Show above="sm">
                  <Box as="pre">{item.value}</Box>
                </Show>
              </ListItem>
            ))}
        </List>
      </Flex>

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
  );
});
