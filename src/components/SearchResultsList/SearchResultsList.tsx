import { Box } from '@chakra-ui/react';
import { IDocsEntity } from '@/api/search/types';
import { SearchResultsSkeleton } from './SearchResultsSkeleton';
import { Item } from '@/components/ResultList/Item';
import { ErrorBoundary } from 'react-error-boundary';

interface SearchResultsListProps {
  docs: IDocsEntity[];
  isLoading: boolean;
  isFetching?: boolean;
  indexStart: number;
  rows?: number;
  highlights?: Partial<Record<string, string[]>>[];
  showHighlights?: boolean;
  isFetchingHighlights?: boolean;
  useNormCite?: boolean;
}

/**
 * Pure results renderer. Accepts data and config as props — no store reads.
 * Shows skeleton while loading (same dimensions as real items, no layout shift).
 */
export const SearchResultsList = ({
  docs,
  isLoading,
  isFetching = false,
  indexStart,
  rows = 10,
  highlights = [],
  showHighlights = false,
  isFetchingHighlights = false,
  useNormCite = false,
}: SearchResultsListProps) => {
  if (isLoading) {
    return <SearchResultsSkeleton rows={rows} />;
  }

  return (
    <Box data-testid="search-results-list" opacity={isFetching ? 0.5 : 1} transition="opacity 0.15s ease">
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
            useNormCite={useNormCite}
          />
        </ErrorBoundary>
      ))}
    </Box>
  );
};
