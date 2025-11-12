import {
  ButtonProps,
  CloseButton,
  forwardRef,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputProps,
  InputRightElement,
  List,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
  useMergeRefs,
  VisuallyHidden,
} from '@chakra-ui/react';
import { ChangeEventHandler, Dispatch, useCallback, useEffect } from 'react';
import { isNonEmptyString } from 'ramda-adjunct';
import { ISearchInputState, SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import {
  getFocusedItemValue,
  getPreview,
  updateUATSearchTerm,
  updateJournalSearchTerm,
} from '@/components/SearchBar/helpers';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useFocus } from '@/lib/useFocus';
import { useKeyDownHandler } from '@/components/SearchBar/hooks/useKeyDownHandler';
import { useUATSearch } from '@/components/SearchBar/hooks/useUATSearch';
import { useJournalSearch } from '@/components/SearchBar/hooks/useJournalSearch';
import { TypeaheadItem } from '@/components/SearchBar/TypeaheadItem';
import { useSyncWithGlobal } from '@/components/SearchBar/hooks/UseSyncWithGlobal';

const SEARCHBAR_MAX_LENGTH = 2048 as const;

export interface ISearchInputProps extends InputProps {
  isLoading?: boolean;
  state: ISearchInputState;
  dispatch: Dispatch<SearchInputAction>;
}

const ClearInputButton = (props: ButtonProps) => {
  return <CloseButton aria-label="Clear search" size="lg" data-testid="searchbar-clear" {...props} />;
};

export const SearchInput = forwardRef<ISearchInputProps, 'input'>((props, ref) => {
  const { isLoading, state, dispatch, ...inputProps } = props;
  const [input, focus] = useFocus({ selectTextOnFocus: false });
  const refs = useMergeRefs(ref, input);
  const onKeyDown = useKeyDownHandler({ isOpen: state.isOpen, dispatch });
  useUATSearch({ query: state.searchTerm, dispatch, cursorPosition: state.cursorPosition });
  const journalSearchParams = useJournalSearch({
    query: state.searchTerm,
    dispatch,
    cursorPosition: state.cursorPosition,
  });
  useSyncWithGlobal({ searchTerm: state.searchTerm, dispatch });

  // handle updates to the cursor position, usually just to move inside "" or ()
  useEffect(() => {
    // if the input is focused and the cursor position is less than the search term length,
    // set the selection range to the cursor position
    if (input.current && state.cursorPosition < state.searchTerm.length) {
      input.current.setSelectionRange(state.cursorPosition, state.cursorPosition);
    }
  }, [input, state.cursorPosition, state.searchTerm.length]);

  useEffect(() => {
    if (state.searchTerm) {
      focus();
    }
  }, [state.searchTerm, focus]);

  // handle updates to the search term
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      dispatch({
        type: 'SET_SEARCH_TERM',
        payload: { query: e.target.value, cursorPosition: e.target.selectionStart },
      });
    },
    [dispatch],
  );

  // clear input
  const handleClearInput = useCallback(() => {
    focus();
    dispatch({ type: 'HARD_RESET' });
  }, [focus, dispatch]);

  const handleOnSelect = useCallback(() => {
    if (input.current) {
      dispatch({
        type: 'SET_SELECTED_RANGE',
        payload: [input.current.selectionStart, input.current.selectionEnd],
      });
    }
  }, [dispatch, input]);

  const handleItemClick = useCallback(() => focus({ moveCursorToEnd: false }), [focus]);

  const value =
    state.focused === -1 || (!state.items.length && !state.uatItems.length && !state.journalItems.length)
      ? state.searchTerm
      : (() => {
          const focusedValue = getFocusedItemValue(
            state.items.length > 0 ? state.items : state.uatItems.length > 0 ? state.uatItems : state.journalItems,
            state.focused,
          );

          if (focusedValue === null) {
            return state.searchTerm;
          }

          // Use appropriate update function based on which type of items are showing
          if (state.uatItems.length > 0) {
            return updateUATSearchTerm(state.searchTerm, focusedValue);
          } else if (state.journalItems.length > 0) {
            return updateJournalSearchTerm(state.searchTerm, focusedValue, journalSearchParams?.fieldType);
          } else {
            return getPreview(state.searchTerm, focusedValue);
          }
        })();

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
              id="tour-search-input"
              maxLength={SEARCHBAR_MAX_LENGTH}
              onSelect={handleOnSelect}
              value={value}
              aria-owns="search-listbox"
              aria-haspopup="listbox"
              aria-expanded={state.isOpen}
              aria-autocomplete="list"
              aria-activedescendant={state.focused > -1 ? `search-item-${state.focused}` : undefined}
              autoFocus
              onKeyDown={onKeyDown}
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
                    id={`search-item-${index}`}
                    data-type="item"
                    data-index={index}
                    data-testid="search-autocomplete-item"
                  />
                ))
              : state.uatItems.length > 0
              ? state.uatItems.map((item, index) => (
                  <TypeaheadItem
                    key={item.id}
                    item={item}
                    dispatch={dispatch}
                    index={index}
                    id={`search-item-${index}`}
                    onClick={handleItemClick}
                    focused={state.focused === index}
                    showValue={false}
                    data-type="uat"
                    data-index={index}
                    data-testid="search-autocomplete-item"
                  />
                ))
              : state.journalItems.length > 0
              ? state.journalItems.map((item, index) => (
                  <TypeaheadItem
                    key={item.id}
                    item={item}
                    dispatch={dispatch}
                    index={index}
                    id={`search-item-${index}`}
                    onClick={handleItemClick}
                    focused={state.focused === index}
                    showValue={false}
                    data-type="journal"
                    data-index={index}
                    data-testid="search-autocomplete-item"
                  />
                ))
              : null}
          </List>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
});
