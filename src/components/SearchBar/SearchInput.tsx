import {
  ButtonProps,
  CloseButton,
  Code,
  DarkMode,
  Flex,
  forwardRef,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputProps,
  InputRightElement,
  LightMode,
  List,
  ListItem,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
  Text,
  useColorMode,
  useMergeRefs,
  VisuallyHidden,
} from '@chakra-ui/react';
import {
  ChangeEventHandler,
  Dispatch,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { isNonEmptyString } from 'ramda-adjunct';
import { TypeaheadOption } from '@/components/SearchBar/types';
import { initialState, reducer, SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { getFocusedItemValue, getPreview } from '@/components/SearchBar/helpers';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useFocus } from '@/lib/useFocus';
import { useColorModeColors } from '@/lib';

const SEARCHBAR_MAX_LENGTH = 2048 as const;

export interface ISearchInputProps extends InputProps {
  isLoading?: boolean;
}

const ClearInputButton = (props: ButtonProps) => {
  return <CloseButton aria-label="Clear search" size="lg" data-testid="searchbar-clear" {...props} />;
};

export const SearchInput = forwardRef<ISearchInputProps, 'input'>((props, ref) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isLoading, ...inputProps } = props;
  const [input, focus] = useFocus({ selectTextOnFocus: false });
  const refs = useMergeRefs(ref, input);
  const { query, queryAddition, onDoneAppendingToQuery, isClearingQuery, onDoneClearingQuery } = useIntermediateQuery();

  // on mount, set the search term, focus and force reset to clear the menu
  useEffect(() => {
    if (isNonEmptyString(query)) {
      dispatch({ type: 'SET_SEARCH_TERM', payload: query });
      dispatch({ type: 'SOFT_RESET' });
      setTimeout(() => focus(), 10);
    }
  }, [query]);

  // handle query additions
  useEffect(() => {
    if (isNonEmptyString(queryAddition)) {
      focus();
      dispatch({ type: 'SET_SEARCH_TERM_ADDITION', payload: queryAddition });
      onDoneAppendingToQuery();
    }
  }, [queryAddition]);

  // run the handlers based on the keydown event
  const handleOnKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      // if any modifier keys, ignore
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
        return;
      }

      if (e.key === 'Enter' && state.isOpen) {
        e.preventDefault();
        dispatch({ type: 'KEYDOWN_ENTER' });
      } else if (e.key === 'Escape' && state.isOpen) {
        e.preventDefault();
        dispatch({ type: 'KEYDOWN_ESCAPE' });
      } else if (e.key === 'ArrowUp' && state.isOpen) {
        e.preventDefault();
        dispatch({ type: 'KEYDOWN_ARROW_UP' });
      } else if (e.key === 'Tab' && state.isOpen) {
        e.preventDefault();
        dispatch({ type: 'KEYDOWN_TAB' });
      }

      if (e.key === 'ArrowDown' && e.currentTarget.selectionStart === e.currentTarget.value.length) {
        e.preventDefault();
        dispatch({ type: 'KEYDOWN_ARROW_DOWN' });
      }

      // if a normal key, then the user is editing, we should close the menu
      if (state.isOpen && !['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
        dispatch({ type: 'SOFT_RESET' });
      }
    },
    [state.isOpen],
  );

  // handle updates to the cursor position, usually just to move inside "" or ()
  useEffect(() => {
    // set cursor position
    if (input.current) {
      input.current.setSelectionRange(state.cursorPosition, state.cursorPosition);
    }
  }, [input.current, state.cursorPosition]);

  // handle updates to the search term
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value });
  };

  // clear input
  const handleClearInput = () => {
    focus();
    dispatch({ type: 'HARD_RESET' });
  };

  useEffect(() => {
    if (isClearingQuery) {
      handleClearInput();
      onDoneClearingQuery();
    }
  }, [isClearingQuery, onDoneClearingQuery, handleClearInput]);

  const handleItemClick = useCallback(() => {
    focus({ moveCursorToEnd: false });
  }, [focus]);

  return (
    <Popover isOpen={state.isOpen} placement="bottom" gutter={0} matchWidth autoFocus={false}>
      <PopoverAnchor>
        <InputGroup
          display="flex"
          aria-labelledby="search-box-label"
          sx={{
            '&:has(input:focus)': {
              boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
              borderRadius: 'md',
            },
          }}
        >
          <VisuallyHidden id="search-box-label">Search Database</VisuallyHidden>
          <InputGroup>
            <Input
              ref={refs}
              type="search"
              role="combobox"
              placeholder="Search..."
              aria-label="Search"
              title="Search"
              maxLength={SEARCHBAR_MAX_LENGTH}
              value={getPreview(state.searchTerm, getFocusedItemValue(state.items, state.focused))}
              aria-owns="search-listbox"
              aria-haspopup="listbox"
              aria-expanded={state.isOpen}
              aria-autocomplete="list"
              aria-activedescendant={state.focused > -1 ? `search-item-${state.focused}` : undefined}
              autoFocus
              onKeyDown={handleOnKeyDown}
              borderLeftRadius="md"
              onChange={handleInputChange}
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="off"
              name="q"
              _focus={{ boxShadow: 'none' }}
              data-testid="search-input"
              {...inputProps}
            />
            {isNonEmptyString(state.searchTerm) && (
              <InputRightElement>
                <ClearInputButton onClick={handleClearInput} isDisabled={isLoading} data-testid="search-clearbtn" />
              </InputRightElement>
            )}
          </InputGroup>
          <IconButton
            type="submit"
            aria-label="search"
            isLoading={isLoading}
            data-testid="search-submit"
            icon={<Icon as={MagnifyingGlassIcon} fontSize="24px" transform="rotate(90deg)" />}
            size="md"
            borderLeftRadius="none"
          />
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent borderRadius={0} borderTop={0} width="full" role="presentation">
        <PopoverBody role="presentation">
          <List
            maxH="md"
            overflowY="auto"
            role="listbox"
            id="search-listbox"
            aria-labelledby="search-box-label"
            data-testid="search-autocomplete-menu"
          >
            {state.items.length > 0 &&
              state.items.map((item, index) => (
                <TypeaheadItem
                  key={item.id}
                  item={item}
                  dispatch={dispatch}
                  index={index}
                  onClick={handleItemClick}
                  focused={state.focused === index}
                  data-testid={`search-autocomplete-item-${index}`}
                />
              ))}
          </List>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
});

const TypeaheadItem = (props: {
  item: TypeaheadOption;
  index: number;
  focused: boolean;
  dispatch: Dispatch<SearchInputAction>;
  onClick?: () => void;
}) => {
  const { focused, item, dispatch, index, onClick } = props;
  const liRef = useRef<HTMLLIElement>(null);
  const colors = useColorModeColors();
  const { colorMode } = useColorMode();
  const [isMouseOver, setIsMouseOver] = useState(false);

  const handleClick = useCallback(() => {
    dispatch({ type: 'FOCUS_ITEM', index });
    dispatch({ type: 'CLICK_ITEM' });
    if (typeof onClick === 'function') {
      onClick();
    }
  }, [onClick]);

  const handleMouseOver = () => {
    setIsMouseOver(true);
  };

  const handleMouseLeave = () => {
    setIsMouseOver(false);
  };

  // scroll element into view when focused
  useEffect(() => {
    if (typeof liRef.current?.scrollIntoView === 'function' && focused) {
      liRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [liRef.current, focused]);

  return (
    <ListItem
      ref={liRef}
      backgroundColor={focused ? 'blue.100' : 'auto'}
      _hover={{ cursor: 'pointer', backgroundColor: colors.highlightBackground }}
      px="2"
      py="1"
      onClick={handleClick}
      role="presentation"
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      <Flex role="option" aria-label={item.label} aria-atomic="true">
        <Text flex="1" role="presentation">
          {item.label}
        </Text>
        {(colorMode === 'dark' && isMouseOver) || colorMode === 'light' ? (
          <LightMode>
            <Code>{item.value}</Code>
          </LightMode>
        ) : (
          <DarkMode>
            <Code>{item.value}</Code>
          </DarkMode>
        )}
      </Flex>
    </ListItem>
  );
};
