import { forwardRef, useEffect, useReducer, useRef } from 'react';

import { ArrowLeftIcon } from '@chakra-ui/icons';
import { Button, useMergeRefs, VStack } from '@chakra-ui/react';
import { ISearchInputProps, SearchInput } from '@/components/SearchBar/SearchInput';
import { initialState, reducer } from '@/components/SearchBar/searchInputReducer';
import { QuickFields } from '@/components/SearchBar/QuickFields';
import { SimpleLink } from '@/components/SimpleLink';
import { useLandingFormPreference } from '@/lib/useLandingFormPreference';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';

interface SearchBarProps extends Omit<ISearchInputProps, 'dispatch' | 'state'> {
  query?: string;
  isLoading?: boolean;
  queryAddition?: string;
  showBackLinkAs?: 'new_search' | 'results' | 'none';
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>((props, ref) => {
  const { query, queryAddition, isLoading, showBackLinkAs = 'none', ...rest } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const refs = useMergeRefs(inputRef, ref);
  const { landingFormUrl } = useLandingFormPreference();
  const { handleBack } = useBackToSearchResults();

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
      {showBackLinkAs === 'new_search' ? (
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
      ) : showBackLinkAs === 'results' ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          leftIcon={<ArrowLeftIcon />}
          alignSelf="flex-start"
          onClick={handleBack}
        >
          Go back
        </Button>
      ) : null}
      <QuickFields isLoading={isLoading} dispatch={dispatch} />
      <SearchInput ref={refs} dispatch={dispatch} state={state} isLoading={isLoading} {...rest} />
    </VStack>
  );
});
SearchBar.displayName = 'SearchBar';
