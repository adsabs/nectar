import { forwardRef, useEffect, useReducer, useRef } from 'react';

import { useMergeRefs, VStack } from '@chakra-ui/react';
import { ISearchInputProps, SearchInput } from '@/components/SearchBar/SearchInput';
import { initialState, reducer } from '@/components/SearchBar/searchInputReducer';
import { QuickFields } from '@/components/SearchBar/QuickFields';

interface SearchBarProps extends Omit<ISearchInputProps, 'dispatch' | 'state'> {
  query?: string;
  isLoading?: boolean;
  queryAddition?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>((props, ref) => {
  const { query, queryAddition, isLoading, ...rest } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const refs = useMergeRefs(inputRef, ref);

  useEffect(() => {
    if (query) {
      dispatch({ type: 'SET_SEARCH_TERM', payload: { query } });
    }
  }, [query]);

  useEffect(() => {
    if (queryAddition) {
      dispatch({ type: 'SET_SEARCH_TERM_ADDITION', payload: { queryAddition } });
    }
  }, [queryAddition]);

  return (
    <VStack as="section" direction="column" spacing={2} align="stretch">
      <QuickFields isLoading={isLoading} dispatch={dispatch} />
      <SearchInput ref={refs} dispatch={dispatch} state={state} {...rest} />
    </VStack>
  );
});
SearchBar.displayName = 'SearchBar';
