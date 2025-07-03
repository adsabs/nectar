import { forwardRef, useReducer, useRef } from 'react';

import { useMergeRefs, VStack } from '@chakra-ui/react';
import { ISearchInputProps, SearchInput } from '@/components/SearchBar/SearchInput';
import { initialState, reducer } from '@/components/SearchBar/searchInputReducer';
import { QuickFields } from '@/components/SearchBar/QuickFields';

export const SearchBar = forwardRef<HTMLInputElement, Omit<ISearchInputProps, 'dispatch' | 'state'>>((props, ref) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const refs = useMergeRefs(inputRef, ref);

  return (
    <VStack as="section" direction="column" spacing={2} align="stretch">
      <QuickFields isLoading={props.isLoading} dispatch={dispatch} />
      <SearchInput ref={refs} dispatch={dispatch} state={state} {...props} />
    </VStack>
  );
});
SearchBar.displayName = 'SearchBar';
