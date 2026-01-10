import { forwardRef, useEffect, useReducer, useRef } from 'react';

import { ArrowLeftIcon } from '@chakra-ui/icons';
import { Button, useMergeRefs, VStack } from '@chakra-ui/react';
import { ISearchInputProps, SearchInput } from '@/components/SearchBar/SearchInput';
import { initialState, reducer } from '@/components/SearchBar/searchInputReducer';
import { QuickFields } from '@/components/SearchBar/QuickFields';
import { SimpleLink } from '@/components/SimpleLink';
import { useLandingFormPreference } from '@/lib/useLandingFormPreference';

interface SearchBarProps extends Omit<ISearchInputProps, 'dispatch' | 'state'> {
  query?: string;
  isLoading?: boolean;
  queryAddition?: string;
  showStartNewSearchLink?: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>((props, ref) => {
  const { query, queryAddition, isLoading, showStartNewSearchLink = false, ...rest } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const refs = useMergeRefs(inputRef, ref);
  const { landingFormUrl } = useLandingFormPreference();

  useEffect(() => {
    if (query !== undefined) {
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
      {showStartNewSearchLink ? (
        <Button
          as={SimpleLink}
          href={landingFormUrl}
          variant="link"
          size="sm"
          leftIcon={<ArrowLeftIcon />}
          alignSelf="flex-start"
          data-testid="start-new-search"
        >
          Start new search
        </Button>
      ) : null}
      <QuickFields isLoading={isLoading} dispatch={dispatch} />
      <SearchInput ref={refs} dispatch={dispatch} state={state} isLoading={isLoading} {...rest} />
    </VStack>
  );
});
SearchBar.displayName = 'SearchBar';
