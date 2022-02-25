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
} from '@chakra-ui/react';
import { useCombobox } from 'downshift';
import { matchSorter } from 'match-sorter';
import { last } from 'ramda';
import { ReactElement, useRef, useState } from 'react';
import { typeaheadOptions } from './models';
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
  return matchSorter(typeaheadOptions, term, { keys: ['match'] });
};

export interface ISearchBarProps {
  isLoading?: boolean;
}

export const SearchBar = (props: ISearchBarProps): ReactElement => {
  // const store = useStoreApi();
  // const { q: query } = useStore((state) => state.query);
  // const updateStoreQuery = useStore((state) => state.updateQuery);
  // const updateQuery = (q: string) => updateStoreQuery({ q });

  const input = useRef<HTMLInputElement>(null);

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
  } = useCombobox({
    items: inputItems,
    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;

      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick: {
          const updatedQuery = state.inputValue.replace(/\s*[^\s]+$/g, '');
          const newInputValue =
            updatedQuery + (updatedQuery.length > 0 ? ' ' + changes.inputValue : changes.inputValue);

          // fix cursor
          if (/[\)"]/.test(last(newInputValue))) {
            setTimeout(() => {
              input.current.setSelectionRange(newInputValue.length - 1, newInputValue.length - 1);
            }, 0);
          }

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
      setInputItems(filterOptions(inputValue));
    },
    itemToString: (item) => item?.value ?? '',
    labelId: 'primary-search-label',
    menuId: 'primary-search-menu',
    inputId: 'primary-search-input',
    getItemId: (index) => `primary-search-menuitem-${index}`,
  });

  const handleReset = () => {
    reset();
    input.current.focus();
  };

  const { popperRef, referenceRef } = usePopper({
    enabled: isOpen,
    matchWidth: true,
    placement: 'bottom-start',
    offset: [0, 3],
  });

  return (
    <Flex as="section" direction="row" alignItems="center">
      <Flex as="section" direction="column" flexGrow="1">
        <label style={visuallyHiddenStyle} {...getLabelProps()}>
          Search Database
        </label>
        <InputGroup size="xl" {...getComboboxProps()}>
          <Input
            disabled={props.isLoading}
            data-testid="primary-search-input"
            variant="outline"
            placeholder="Search..."
            type="search"
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
              },
            })}
            spellCheck="false"
            autoComplete="off"
          />

          {inputValue.length > 0 && (
            <InputRightElement>
              <CloseButton
                aria-label="Clear search"
                size="lg"
                onClick={handleReset}
                data-testid="primary-search-clear"
              />
            </InputRightElement>
          )}
        </InputGroup>

        <List
          backgroundColor="white"
          borderRadius="md"
          borderTopRadius="none"
          boxShadow="lg"
          zIndex="1000"
          // border="1px"
          // borderColor="gray.200"
          data-testid="primary-search-menu"
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
                key={`${item}${index}`}
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
      <Button h="40px" borderLeftRadius="none">
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
};
