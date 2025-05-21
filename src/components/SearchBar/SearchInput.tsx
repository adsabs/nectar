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
  useDeferredValue,
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
import { useColorModeColors } from '@/lib/useColorModeColors';
import { useUATTermsSearchOptions } from '@/api/uat/uat';

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
  const [userInput, setUserInput] = useState<{ value: string; cursorPos: number }>({ value: '', cursorPos: 0 });
  const deferredUserInput = useDeferredValue(userInput);
  const [uatSearchTerm, setUatSearchTerm] = useState(null);

  const { data: uatSearchTermOptions } = useUATTermsSearchOptions(
    { term: uatSearchTerm },
    { enabled: !!uatSearchTerm },
  );

  useEffect(() => {
    if (!!uatSearchTermOptions) {
      dispatch({ type: 'SET_UAT_TYPEAHEAD_OPTIONS', payload: uatSearchTermOptions });
    }
    setUatSearchTerm(null); // reset
  }, [uatSearchTermOptions]);

  // on mount, set the search term, focus and force reset to clear the menu
  useEffect(() => {
    if (isNonEmptyString(query)) {
      dispatch({ type: 'SET_SEARCH_TERM', payload: { query } });
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
    setUserInput({ value: e.target.value, cursorPos: e.target.selectionStart });
    const value = e.target.value;
    const fields = splitSearchItems(value);

    // hide the default auto-complete dropdown if doing a UAT search
    dispatch({ type: 'SET_SEARCH_TERM', payload: { query: value, hideMenu: isLastSearchTermUAT(fields) } });
  };

  /* *
   * if user is typing in the UAT keyword, show auto complete
   *
   * conditions:
   * - the last search term starts with `uat:"`
   * - user has typed partial UAT keyword
   * - cursor is at the last term, inside quote `uat:""`,
   *   where the closing quote might or might not exist
   *
   * */
  useEffect(() => {
    const { value: searchString, cursorPos } = deferredUserInput;
    const terms = splitSearchItems(searchString);

    if (isLastSearchTermUAT(terms)) {
      const lastSearchTerm = terms[terms.length - 1];

      // has partial uat keyword
      const test = terms[terms.length - 1].match(/uat:"([^"]*)"?$/i);
      if (test && test.length > 1 && test[1].length > 0) {
        const uatKeyword = test[1];

        // only show uat auto complete if user is typing inside the last term value: uat:"xxx|x"
        const uatKeywordStartPos = searchString.length - lastSearchTerm.length + 'uat:"'.length - 1;
        const uatKeywordEndPos = lastSearchTerm.endsWith('"') ? searchString.length - 1 : searchString.length;
        if (cursorPos >= uatKeywordStartPos && cursorPos <= uatKeywordEndPos) {
          // trigger UAT keyword search
          setUatSearchTerm(uatKeyword);
        }
      }
    }
  }, [deferredUserInput]);

  const splitSearchItems = (value: string) => {
    // split each search item
    return value.match(/(?:[^\s"]+|"[^"]*")+\w*(?:[^\s"]+|"[^"]*){0,1}/g);
  };

  const isLastSearchTermUAT = (fields: RegExpMatchArray) => {
    return fields && fields.length > 0 && fields[fields.length - 1].toLowerCase().startsWith('uat:"');
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
    <Popover isOpen={state.isOpen} placement="bottom" gutter={0} matchWidth autoFocus={false} strategy="fixed">
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
              value={
                state.items.length > 0
                  ? getPreview(state.searchTerm, getFocusedItemValue(state.items, state.focused))
                  : state.searchTerm
              }
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
            {state.items.length > 0
              ? state.items.map((item, index) => (
                  <TypeaheadItem
                    key={item.id}
                    item={item}
                    dispatch={dispatch}
                    index={index}
                    onClick={handleItemClick}
                    focused={state.focused === index}
                    data-testid={`search-autocomplete-item-${index}`}
                  />
                ))
              : state.uatItems.length > 0
              ? state.uatItems.map((item, index) => (
                  <TypeaheadItem
                    key={item.id}
                    item={item}
                    dispatch={dispatch}
                    index={index}
                    onClick={handleItemClick}
                    focused={state.focused === index}
                    showValue={false}
                  />
                ))
              : null}
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
  showValue?: boolean;
  onClick?: () => void;
}) => {
  const { focused, item, dispatch, index, onClick, showValue = true } = props;
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
      <Flex direction="column">
        <Flex role="option" aria-label={item.label} aria-atomic="true">
          <Text flex="1" role="presentation">
            {item.label}
          </Text>
          {showValue && (
            <>
              {(colorMode === 'dark' && isMouseOver) || colorMode === 'light' ? (
                <LightMode>
                  <Code>{item.value}</Code>
                </LightMode>
              ) : (
                <DarkMode>
                  <Code>{item.value}</Code>
                </DarkMode>
              )}
            </>
          )}
        </Flex>
        {item.desc && (
          <Text mx={2} fontSize="xs" fontWeight="light">
            {item.desc}
          </Text>
        )}
      </Flex>
    </ListItem>
  );
};
