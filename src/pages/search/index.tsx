import dynamic from 'next/dynamic';
import { IYearHistogramSliderProps } from '@/components/SearchFacet/YearHistogramSlider';
import { ISearchFacetsProps } from '@/components/SearchFacet';
import { AppState, useStore, useStoreApi } from '@/store';
import { last, omit } from 'ramda';
import shallow from 'zustand/shallow';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Heading,
  Icon,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Portal,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
  useDisclosure,
  useMediaQuery,
  VisuallyHidden,
} from '@chakra-ui/react';
import { calculateStartIndex } from '@/components/ResultList/Pagination/usePagination';
import { FormEventHandler, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsClient } from '@/lib/useIsClient';
import { useScrollRestoration } from '@/lib/useScrollRestoration';
import { LocalSettings, NumPerPageType } from '@/types';
import Head from 'next/head';
import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import { HideOnPrint } from '@/components/HideOnPrint';
import { SearchBar } from '@/components/SearchBar';
import { NumFound } from '@/components/NumFound';
import { FacetFilters } from '@/components/SearchFacet/FacetFilters';
import { ItemsSkeleton, ListActions, Pagination, SimpleResultList } from '@/components/ResultList';
import { AddToLibraryModal } from '@/components/Libraries';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { CustomInfoMessage } from '@/components/Feedbacks';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { SimpleLink } from '@/components/SimpleLink';
import { makeSearchParams, normalizeSolrSort, parseQueryFromUrl } from '@/utils/common/search';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { SEARCH_API_KEYS, useSearch } from '@/api/search/search';
import { defaultParams } from '@/api/search/models';
import { solrDefaultSortDirection, SolrSort, SolrSortField } from '@/api/models';
import { useApplyBoostTypeToParams } from '@/lib/useApplyBoostTypeToParams';
import { SearchErrorAlert } from '@/components/SolrErrorAlert/SolrErrorAlert';
import { useSettings } from '@/lib/useSettings';
import { getResultsSteps } from '@/components/NavBar';
import { useShepherd } from 'react-shepherd';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { handleBoundaryError } from '@/lib/errorHandler';

const YearHistogramSlider = dynamic<IYearHistogramSliderProps>(
  () =>
    import('@/components/SearchFacet/YearHistogramSlider').then((mod) => ({
      default: mod.YearHistogramSlider,
    })),
  { ssr: false },
);

const SearchFacets = dynamic<ISearchFacetsProps>(
  () =>
    import('@/components/SearchFacet').then((mod) => ({
      default: mod.SearchFacets,
    })),
  { ssr: false },
);

/**
 * Consolidated selector for search page store values
 * Using shallow comparison to prevent unnecessary re-renders
 */
const useSearchPageStore = () =>
  useStore(
    (state) => ({
      numPerPage: state.numPerPage,
      sort: state.query.sort[0],
      setQuery: state.setQuery,
      updateQuery: state.updateQuery,
      submitQuery: state.submitQuery,
      setNumPerPage: state.setNumPerPage,
      setDocs: state.setDocs,
      clearAllSelected: state.clearAllSelected,
    }),
    shallow,
  );

const selectors = {
  showFilters: (state: AppState) => state.settings.searchFacets.open,
  toggleSearchFacetsOpen: (state: AppState) => state.toggleSearchFacetsOpen,
  resetSearchFacets: (state: AppState) => state.resetSearchFacets,
};

const omitP = omit(['p']);

/**
 * Error fallback component for error boundaries
 */
const ErrorFallback = ({ label, resetErrorBoundary }: FallbackProps & { label: string }) => (
  <Alert status="error" my={2} borderRadius="md">
    <AlertIcon />
    <Box flex="1">
      <Text>{label}</Text>
    </Box>
    <Button size="sm" colorScheme="blue" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </Alert>
);

const SearchPage: NextPage = () => {
  const router = useRouter();
  const store = useStoreApi();

  // Consolidated store selector - reduces subscription overhead
  const {
    numPerPage: storeNumPerPage,
    sort,
    setQuery,
    updateQuery,
    submitQuery,
    setNumPerPage,
    setDocs,
    clearAllSelected: clearSelectedDocs,
  } = useSearchPageStore();

  const { settings } = useSettings({ suspense: false });

  const queryClient = useQueryClient();
  const queries = queryClient.getQueriesData<IADSApiSearchResponse>([SEARCH_API_KEYS.primary]);
  // Safely extract numFound with defensive null checks
  const lastQuery = queries.length > 1 ? last(queries) : null;
  const numFound = lastQuery?.[1]?.response?.numFound;
  const [isPrint] = useMediaQuery('print');

  // parse the query params from the URL, this should match what the server parsed
  const parsedParams = parseQueryFromUrl(router.asPath);
  const hasSortParam = useMemo(() => {
    const queryString = router.asPath.split('?')[1];
    if (!queryString) {
      return false;
    }
    return new URLSearchParams(queryString).has('sort');
  }, [router.asPath]);
  const preferredSortField = settings?.preferredSearchSort ?? APP_DEFAULTS.PREFERRED_SEARCH_SORT;
  const preferredSort = useMemo(
    () => normalizeSolrSort([`${preferredSortField} ${solrDefaultSortDirection[preferredSortField]}`]),
    [preferredSortField],
  );
  const sortWithDefault = hasSortParam ? parsedParams.sort : preferredSort;
  const { params } = useApplyBoostTypeToParams({
    params: {
      ...defaultParams,
      ...parsedParams,
      sort: sortWithDefault,
      rows: storeNumPerPage,
      start: calculateStartIndex(parsedParams.p, storeNumPerPage, numFound),
    },
  });

  const searchParams = omitP(params) as IADSApiSearchParams;
  const { data, isSuccess, isLoading, isFetching, error, isError, refetch } = useSearch<IADSApiSearchResponse>(
    searchParams,
    { select: (data) => data },
  );
  const histogramContainerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  // Track if search is taking longer than expected
  const SLOW_SEARCH_THRESHOLD_MS = 5000;
  const [isSlowSearch, setIsSlowSearch] = useState(false);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    if (isLoading || isFetching) {
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setIsSlowSearch(true);
        }
      }, SLOW_SEARCH_THRESHOLD_MS);
    } else {
      setIsSlowSearch(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, isFetching]);

  // Scroll restoration hook - automatically restores scroll position when returning from abstract page
  useScrollRestoration();

  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  // start tour on the first time
  useTour();

  // on Sort change handler
  const handleSortChange = (sort: SolrSort) => {
    const query = store.getState().query;
    if (query.q.length === 0) {
      // if query is empty, do not submit search
      return;
    }

    // if sort field has changed, use its default sort order
    const currentSortField = query.sort[0].split(' ')[0];
    const newSortField = sort.split(' ')[0] as SolrSortField;

    const newSort =
      currentSortField === newSortField ? sort : `${newSortField} ${solrDefaultSortDirection[newSortField]}`;

    // generate search string and trigger page transition, also update store
    const search = makeSearchParams({ ...params, ...query, sort: newSort, p: 1 });
    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  // On submission handler
  const handleOnSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q') as string;

    const query = store.getState().query;
    if (q.length === 0) {
      // if query is empty, do not submit search
      return;
    }

    // clear current docs since we are entering new search
    clearSelectedDocs();

    // generate a URL search string and trigger a page transition, and update store
    const search = makeSearchParams({ ...params, ...query, q, p: 1 });
    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  // Update the store when we have data
  useEffect(() => {
    if (data?.response.docs.length > 0) {
      setDocs(data.response.docs.map((d) => d.bibcode));
      setQuery(searchParams);
      submitQuery();
    }
    // Note: setDocs, setQuery, submitQuery are stable Zustand actions
    // searchParams is derived from router, changes trigger new data fetch
  }, [data, setDocs, setQuery, submitQuery, searchParams]);

  // Memoized retry handler for error alert
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * When updating perPage, this updates the store with both the current
   * numPerPage value and the current query
   */
  const handlePerPageChange = (numPerPage: NumPerPageType) => {
    // should reset to the first page on numPerPage update
    updateQuery({ start: 0, rows: numPerPage });
    setNumPerPage(numPerPage);
  };

  const handleSearchFacetSubmission = (queryUpdates: Partial<IADSApiSearchParams>) => {
    const search = makeSearchParams({ ...params, ...queryUpdates, p: 1 });

    // clear current docs on filter change
    clearSelectedDocs();

    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  // conditions
  const loading = isLoading || isFetching;
  const noResults = !loading && isSuccess && data?.response.numFound === 0;
  const hasResults = !loading && isSuccess && data?.response.numFound > 0;
  const showFilters = !isPrint && isClient;
  const showListActions = !isPrint && (loading || hasResults);

  return (
    <Box>
      <Head>
        <title>{`${params.q} - ${BRAND_NAME_FULL} Search`}</title>
      </Head>
      <Stack direction="column" aria-labelledby="search-form-title" spacing={10}>
        <HideOnPrint pt={10}>
          <form method="get" action="/search" onSubmit={handleOnSubmit}>
            <Flex direction="column" width="full">
              <SearchBar isLoading={loading} showBackLinkAs="new_search" />
              <NumFound count={data?.response.numFound} isLoading={loading} />
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
                    <ErrorFallback {...props} label="Unable to load filters. Please try again." />
                  )}
                >
                  <SearchFacetFilters
                    onSearchFacetSubmission={handleSearchFacetSubmission}
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
                    onError={(error, errorInfo) => handleBoundaryError(error, errorInfo, { component: 'ListActions' })}
                    fallbackRender={(props) => (
                      <ErrorFallback {...props} label="Unable to load actions. Please try again." />
                    )}
                  >
                    <ListActions
                      onSortChange={handleSortChange}
                      onOpenAddToLibrary={onOpenAddToLibrary}
                      isLoading={isLoading}
                    />
                  </ErrorBoundary>
                )}
              </QueryErrorResetBoundary>
            ) : null}
            <VisuallyHidden as="h2" id="search-form-title">
              Search Results
            </VisuallyHidden>

            {isError ? (
              <SearchErrorAlert error={error} onRetry={handleRetry} isRetrying={isFetching} />
            ) : (
              <>
                {noResults ? <NoResultsMsg /> : null}
                {loading ? (
                  <>
                    {isSlowSearch && (
                      <Alert status="info" mb={2} borderRadius="md" role="status" aria-live="polite">
                        <AlertIcon />
                        <Text>This search is taking longer than expected. Please wait...</Text>
                      </Alert>
                    )}
                    <ItemsSkeleton count={storeNumPerPage} />
                  </>
                ) : null}
                <PartialResultsWarning isPartialResults={data?.responseHeader?.partialResults} />

                {data && (
                  <>
                    <QueryErrorResetBoundary>
                      {({ reset }) => (
                        <ErrorBoundary
                          onReset={reset}
                          onError={(error, errorInfo) =>
                            handleBoundaryError(error, errorInfo, { component: 'SimpleResultList' })
                          }
                          fallbackRender={(props) => (
                            <ErrorFallback {...props} label="Unable to display results. Please try again." />
                          )}
                        >
                          <SimpleResultList
                            docs={data.response.docs}
                            indexStart={params.start}
                            useNormCite={sort.startsWith('citation_count_norm')}
                          />
                        </ErrorBoundary>
                      )}
                    </QueryErrorResetBoundary>
                    {!isPrint && (
                      <Pagination
                        numPerPage={storeNumPerPage}
                        page={params.p as number}
                        totalResults={data.response.numFound}
                        onPerPageSelect={handlePerPageChange}
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
  );
};

const SearchFacetFilters = (props: {
  histogramContainerRef?: RefObject<HTMLDivElement>;
  onSearchFacetSubmission: (queryUpdates: Partial<IADSApiSearchParams>) => void;
}) => {
  const { onSearchFacetSubmission, histogramContainerRef } = props;
  const showFilters = useStore(selectors.showFilters);
  const handleToggleFilters = useStore(selectors.toggleSearchFacetsOpen);
  const handleResetFilters = useStore(selectors.resetSearchFacets);
  const [histogramExpanded, setHistogramExpanded] = useState(false);

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { isOpen: isFacetOpen, onClose: onCloseFacet, onOpen: onOpenFacet } = useDisclosure();

  if (isMobile) {
    return (
      <>
        <Box as="aside" aria-labelledby="search-facets">
          <Portal appendToParentPortal>
            <Button
              position="fixed"
              transform="rotate(90deg)"
              transformOrigin="bottom left"
              borderBottomRadius="none"
              size="xs"
              type="button"
              onClick={onOpenFacet}
              top="240px"
              left="0"
              id="tour-search-facets"
            >
              Show Filters
            </Button>
          </Portal>
        </Box>
        <Drawer placement="left" onClose={onCloseFacet} isOpen={isFacetOpen}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerBody>
              <SearchFacets onQueryUpdate={onSearchFacetSubmission} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  if (showFilters) {
    return (
      <Flex as="aside" aria-labelledby="search-facets" minWidth="250px" direction="column" id="tour-search-facets">
        <Flex mb={5}>
          <Heading as="h2" id="search-facets" fontSize="normal" flex="1">
            Filters
          </Heading>
          <Tooltip label="Reset filters">
            <IconButton
              variant="unstyled"
              icon={
                <Center>
                  <Icon as={ArrowPathIcon} />
                </Center>
              }
              size="xs"
              fontSize="xl"
              aria-label="reset filters"
              type="button"
              onClick={handleResetFilters}
              _hover={{
                backgroundColor: 'blue.50',
                border: 'solid 1px gray.400',
              }}
            />
          </Tooltip>
          <Tooltip label="Hide filters">
            <IconButton
              variant="unstyled"
              icon={
                <Center>
                  <Icon as={XMarkIcon} />
                </Center>
              }
              size="xs"
              fontSize="2xl"
              aria-label="hide filters"
              type="button"
              onClick={handleToggleFilters}
              fontWeight="normal"
              _hover={{
                backgroundColor: 'blue.50',
                border: 'solid 1px gray.400',
              }}
            />
          </Tooltip>
        </Flex>
        {histogramExpanded ? (
          <Portal containerRef={histogramContainerRef}>
            <Box mt={10}>
              <YearHistogramSlider
                onQueryUpdate={onSearchFacetSubmission}
                onExpand={() => setHistogramExpanded((state) => !state)}
                expanded={true}
                width={props.histogramContainerRef?.current?.offsetWidth || 200}
                height={125}
              />
            </Box>
          </Portal>
        ) : (
          <YearHistogramSlider
            onQueryUpdate={onSearchFacetSubmission}
            onExpand={() => setHistogramExpanded((state) => !state)}
            expanded={false}
            width={200}
            height={125}
          />
        )}
        <SearchFacets onQueryUpdate={onSearchFacetSubmission} />
      </Flex>
    );
  }
  return (
    <Box as="aside" aria-labelledby="search-facets">
      <Portal appendToParentPortal>
        <Button
          position="absolute"
          transform="rotate(90deg)"
          transformOrigin="bottom left"
          borderBottomRadius="none"
          size="xs"
          type="button"
          onClick={handleToggleFilters}
          top="240px"
          left="0"
          id="tour-search-facets"
        >
          Show Filters
        </Button>
      </Portal>
    </Box>
  );
};

const NoResultsMsg = () => (
  <CustomInfoMessage
    status="info"
    alertTitle={<>Sorry no results were found</>}
    description={
      <List w="100%">
        <ListItem>
          <ListIcon as={CheckCircleIcon} color="green.500" />
          Try broadening your search
        </ListItem>
        <ListItem>
          <ListIcon as={CheckCircleIcon} color="green.500" />
          Disable any filters that may be applied
        </ListItem>
        <ListItem>
          <Flex direction="row" alignItems="center">
            <ListIcon as={CheckCircleIcon} color="green.500" />
            <SimpleLink href="/">Check out some examples</SimpleLink>
          </Flex>
        </ListItem>
        <ListItem>
          <Flex direction="row" alignItems="center">
            <ListIcon as={CheckCircleIcon} color="green.500" />
            <SimpleLink href="/help/search/search-syntax" newTab={true}>
              Read our help pages
            </SimpleLink>
          </Flex>
        </ListItem>
      </List>
    }
  />
);

export default SearchPage;

/**
 * Shows a warning if the returned search is flagged as having partial results.
 * This is used to inform users that the results may not be complete.
 */
const PartialResultsWarning = ({ isPartialResults }: { isPartialResults?: boolean }) => {
  if (!isPartialResults) {
    return null;
  }

  return (
    <Alert status="warning" mb={1} borderRadius="md">
      <AlertIcon />
      <Text>
        The search took too long, so some results may be missing. Try refining your query to make it faster and see
        everything.
      </Text>
    </Alert>
  );
};

const useTour = () => {
  const Shepherd = useShepherd();
  const [isRendered, setIsRendered] = useState(false);

  // tour should not start until the first element is rendered
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const element = document.getElementById('sort-order');
      if (element) {
        setIsRendered(true);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isRendered && !localStorage.getItem(LocalSettings.SEEN_RESULTS_TOUR)) {
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          scrollTo: false,
          cancelIcon: {
            enabled: true,
          },
        },
        exitOnEsc: true,
      });
      tour.addSteps(getResultsSteps());
      localStorage.setItem(LocalSettings.SEEN_RESULTS_TOUR, 'true');

      setTimeout(() => {
        tour.start();
      }, 1000);
    }
  }, [isRendered]);
};

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
