import { Alert, AlertIcon, Box, Text } from '@chakra-ui/react';
import { IDocsEntity } from '@/api/search/types';
import { SearchResultsSkeleton } from './SearchResultsSkeleton';
import { Item } from '@/components/ResultList/Item';
import { ErrorBoundary } from 'react-error-boundary';

interface SearchResultsListProps {
  docs: IDocsEntity[];
  numFound: number;
  isLoading: boolean;
  isError: boolean;
  indexStart: number;
  rows?: number;
  highlights?: Partial<Record<string, string[]>>[];
  showHighlights?: boolean;
  isFetchingHighlights?: boolean;
}

/**
 * Pure results renderer. Accepts data and config as props — no store reads.
 * Shows skeleton while loading (same dimensions as real items, no layout shift).
 */
export const SearchResultsList = ({
  docs,
  numFound,
  isLoading,
  isError,
  indexStart,
  rows = 10,
  highlights = [],
  showHighlights = false,
  isFetchingHighlights = false,
}: SearchResultsListProps) => {
  if (isLoading) {
    return <SearchResultsSkeleton rows={rows} />;
  }

  if (isError) {
    return (
      <Alert status="error" role="alert">
        <AlertIcon />
        Search failed. Please try again.
      </Alert>
    );
  }

  if (numFound === 0) {
    return (
      <Box p={4} data-testid="search-results-empty">
        <Text>No results found for your search.</Text>
      </Box>
    );
  }

  return (
    <Box data-testid="search-results-list">
      {docs.map((doc, i) => (
        <ErrorBoundary key={doc.bibcode} fallbackRender={() => null}>
          <Item
            doc={doc}
            index={indexStart + i + 1}
            hideCheckbox={false}
            hideActions={false}
            showHighlights={showHighlights}
            isFetchingHighlights={isFetchingHighlights}
            highlights={highlights[i]}
          />
        </ErrorBoundary>
      ))}
    </Box>
  );
};
