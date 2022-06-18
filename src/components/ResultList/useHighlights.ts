import { IADSApiSearchResponse, useGetHighlights } from '@api';
import { useToast } from '@chakra-ui/react';
import { AppState, useStore } from '@store';
import { decode } from 'he';
import { flatten, map, pipe, reduce, values } from 'ramda';

/**
 * Transform incoming highlights data into 2d array
 *
 * This also performs decoding of HTML entities on the strings
 *
 * {
 *  1111: { abstract: [ "foo" ] },
 *  2222: { abstract: [ "bar" ], title: [ "baz &copy;" ] }
 * }
 * ---> [["foo"], ["bar", "baz ©"]]
 */
const decoder = pipe<[Record<string, string>], string[], string[], string[]>(values, flatten, map(decode));
const transformHighlights = pipe<[IADSApiSearchResponse['highlighting']], Record<string, string>[], string[][]>(
  values,
  reduce((acc, value) => [...acc, [...decoder(value)]], [] as string[][]),
);

const selectors = {
  latestQuery: (state: AppState) => state.latestQuery,
  showHighlights: (state: AppState) => state.showHighlights,
};

/**
 * Hook to get highlight data
 *
 * This will fetch highlights based on the latest query in the global store.
 * It also watches the global switch for `showHighlights`, so no fetching will happen unless that is set
 */
export const useHighlights = () => {
  const toast = useToast();
  const latestQuery = useStore(selectors.latestQuery);
  const showHighlights = useStore(selectors.showHighlights);

  const { error, isFetching, data } = useGetHighlights(latestQuery, {
    // will not trigger unless the toggle has been set
    enabled: showHighlights,
    notifyOnChangeProps: ['data', 'error', 'isFetching'],
  });

  // if error, show toast message
  if (error) {
    toast({
      status: 'error',
      title: 'Error!',
      description: 'Unable to fetch highlights',
    });
  }

  return { showHighlights, highlights: transformHighlights(data), isFetchingHighlights: isFetching };
};
