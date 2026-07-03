import { NextPage } from 'next';
import Head from 'next/head';
import { useMemo, useRef } from 'react';

import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  Stack,
  Text,
  useDisclosure,
  useMediaQuery,
  VisuallyHidden,
} from '@chakra-ui/react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { BRAND_NAME_FULL } from '@/config';
import { HideOnPrint } from '@/components/HideOnPrint';
import { AddToLibraryModal } from '@/components/Libraries';
import { NumFound } from '@/components/NumFound';
import { ItemsSkeleton, ListActions, Pagination, SimpleResultList } from '@/components/ResultList';
import { SearchBar } from '@/components/SearchBar';
import { FacetFilters } from '@/components/SearchFacet/FacetFilters';
import { NoResultsMsg, PartialResultsWarning, SearchErrorFallback, SearchFacetFilters } from '@/components/SearchPage';
import { SearchErrorAlert } from '@/components/SolrErrorAlert/SolrErrorAlert';
import { handleBoundaryError } from '@/lib/errorHandler';
import { SearchQueryProvider } from '@/lib/SearchQueryContext';
import { useSearchPage } from '@/lib/search/useSearchPage';
import { useIsClient } from '@/lib/useIsClient';
import { useScrollRestoration } from '@/lib/useScrollRestoration';
import { useSearchResultsTour } from '@/lib/useSearchResultsTour';
import { useCaptureSearchReturnUrl } from '@/lib/useSearchReturnTo';

const SearchPage: NextPage = () => {
  const { params, searchParams, facetParams, results, handlers, start, showHighlights } = useSearchPage();

  // distributes the active search's canonical query + status to facets,
  // histogram, and result stats (read-only — the URL is the source of truth)
  const searchQueryContextValue = useMemo(
    () => ({ facetParams, searchStatus: results.searchStatus }),
    [facetParams, results.searchStatus],
  );

  const [isPrint] = useMediaQuery('print');
  const isClient = useIsClient();
  const histogramContainerRef = useRef<HTMLDivElement>(null);

  // Scroll restoration hook - automatically restores scroll position when returning from abstract page
  useScrollRestoration();

  // Capture this tab's results URL so other pages can offer a reliable "back to results" link
  useCaptureSearchReturnUrl();

  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  // start tour on the first time
  useSearchResultsTour();

  // conditions
  const loading = results.isLoading || results.isFetching;
  // 'loading' status means a genuinely new search (not a same-key background
  // refetch) — show skeletons instead of the previous query's results
  const isNewSearchLoading = results.searchStatus === 'loading';
  const noResults = results.searchStatus === 'empty';
  const hasResults = results.numFound > 0;
  const hasDocs = results.docs.length > 0;

  const showFilters = !isPrint && isClient;
  const showListActions = !isPrint && (loading || hasResults);

  return (
    <SearchQueryProvider value={searchQueryContextValue}>
      <Box>
        <Head>
          <title>{`${params.q} - ${BRAND_NAME_FULL} Search`}</title>
        </Head>
        <Stack direction="column" spacing={10}>
          <HideOnPrint pt={10}>
            <form method="get" action="/search" onSubmit={handlers.onSubmit}>
              <Flex direction="column" width="full">
                <SearchBar isLoading={loading} showBackLinkAs="new_search" />
                <NumFound count={results.numFound} isLoading={loading} />
              </Flex>
              <FacetFilters mt="2" />
            </form>
            <Box ref={histogramContainerRef} />
          </HideOnPrint>
          <Flex direction="row" gap={{ base: 0, lg: 10 }} width="full">
            {showFilters ? (
              <QueryErrorResetBoundary>
                {({ reset }) => (
                  <ErrorBoundary
                    onReset={reset}
                    onError={(error, errorInfo) =>
                      handleBoundaryError(error, errorInfo, { component: 'SearchFacetFilters' })
                    }
                    fallbackRender={(props) => (
                      <SearchErrorFallback {...props} label="Unable to load filters. Please try again." />
                    )}
                  >
                    <SearchFacetFilters
                      onSearchFacetSubmission={handlers.onFacetSubmission}
                      histogramContainerRef={histogramContainerRef}
                    />
                  </ErrorBoundary>
                )}
              </QueryErrorResetBoundary>
            ) : null}
            <Box width="full">
              {showListActions ? (
                <QueryErrorResetBoundary>
                  {({ reset }) => (
                    <ErrorBoundary
                      onReset={reset}
                      onError={(error, errorInfo) =>
                        handleBoundaryError(error, errorInfo, { component: 'ListActions' })
                      }
                      fallbackRender={(props) => (
                        <SearchErrorFallback {...props} label="Unable to load actions. Please try again." />
                      )}
                    >
                      <ListActions
                        onSortChange={handlers.onSortChange}
                        onOpenAddToLibrary={onOpenAddToLibrary}
                        isLoading={isNewSearchLoading}
                        currentSort={params.sort[0]}
                        showHighlights={showHighlights}
                        onToggleHighlights={handlers.onToggleHighlights}
                      />
                    </ErrorBoundary>
                  )}
                </QueryErrorResetBoundary>
              ) : null}
              <VisuallyHidden as="h2" id="search-form-title">
                Search Results
              </VisuallyHidden>

              {results.isError ? (
                <SearchErrorAlert error={results.error} onRetry={results.refetch} isRetrying={results.isFetching} />
              ) : (
                <>
                  {noResults ? <NoResultsMsg /> : null}
                  {loading && results.isSlowSearch ? (
                    <Alert status="info" mb={2} borderRadius="md" role="status" aria-live="polite">
                      <AlertIcon />
                      <Text>This search is taking longer than expected. Please wait...</Text>
                    </Alert>
                  ) : null}
                  {isNewSearchLoading ? <ItemsSkeleton count={params.rows} /> : null}
                  <PartialResultsWarning isPartialResults={results.isPartialResults} />

                  {hasDocs && !isNewSearchLoading && (
                    <>
                      <QueryErrorResetBoundary>
                        {({ reset }) => (
                          <ErrorBoundary
                            onReset={reset}
                            onError={(error, errorInfo) =>
                              handleBoundaryError(error, errorInfo, { component: 'SimpleResultList' })
                            }
                            fallbackRender={(props) => (
                              <SearchErrorFallback {...props} label="Unable to display results. Please try again." />
                            )}
                          >
                            <SimpleResultList
                              docs={results.docs}
                              indexStart={start}
                              useNormCite={params.sort[0].startsWith('citation_count_norm')}
                              highlightsQuery={searchParams}
                              showHighlights={showHighlights}
                              measureRenderSpan
                            />
                          </ErrorBoundary>
                        )}
                      </QueryErrorResetBoundary>
                      {!isPrint && (
                        <Pagination
                          numPerPage={params.rows}
                          page={params.p}
                          totalResults={results.numFound}
                          onPerPageSelect={handlers.onPerPageChange}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </Box>
          </Flex>
        </Stack>
        <AddToLibraryModal isOpen={isAddToLibraryOpen} onClose={onCloseAddToLibrary} />
      </Box>
    </SearchQueryProvider>
  );
};

export default SearchPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
