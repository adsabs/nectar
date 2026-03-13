import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import Head from 'next/head';
import { FormEventHandler, RefObject, useCallback, useMemo, useRef, useState } from 'react';
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
import { useRouter } from 'next/router';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { BRAND_NAME_FULL } from '@/config';
import { useSearchPage } from '@/lib/search/useSearchPage';
import { useScrollRestoration } from '@/lib/useScrollRestoration';
import { SearchBar } from '@/components/SearchBar';
import { NumFound } from '@/components/NumFound';
import { FacetFilters } from '@/components/SearchFacet/FacetFilters';
import { HideOnPrint } from '@/components/HideOnPrint';
import { SearchResultsList } from '@/components/SearchResultsList/SearchResultsList';
import { Pagination } from '@/components/ResultList/Pagination/Pagination';
import { NumPerPageType } from '@/types';
import { useHighlights } from '@/components/ResultList/useHighlights';
import { ListActions } from '@/components/ResultList/ListActions';
import { AddToLibraryModal } from '@/components/Libraries';
import { CustomInfoMessage } from '@/components/Feedbacks';
import { SimpleLink } from '@/components/SimpleLink';
import { handleBoundaryError } from '@/lib/errorHandler';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import type { IADSApiSearchParams } from '@/api/search/types';
import { SolrSort } from '@/api/models';
import { toApiParams } from '@/lib/search/toApiParams';
import { searchParamsParsers } from '@/lib/search/useSearchQueryParams';
import { IYearHistogramSliderProps } from '@/components/SearchFacet/YearHistogramSlider';
import { ISearchFacetsProps } from '@/components/SearchFacet';
import { AppState, useStore } from '@/store';

/** Keys owned by nuqs — must not be forwarded as extra Solr params */
const NUQS_KEYS = new Set(Object.keys(searchParamsParsers));

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

const selectors = {
  showFilters: (state: AppState) => state.settings.searchFacets.open,
  toggleSearchFacetsOpen: (state: AppState) => state.toggleSearchFacetsOpen,
  resetSearchFacets: (state: AppState) => state.resetSearchFacets,
};

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

/**
 * Search results page.
 * Two-column layout: facet sidebar (left) + results (right).
 * URL state, API results, and event handlers from useSearchPage.
 */
const SearchPage: NextPage = () => {
  const router = useRouter();
  // Dynamic Solr local params (e.g. fq_range, fq_author_facet_hier) written to
  // the URL by FacetFilters via router.push. Not managed by nuqs — must be read
  // from router.query and forwarded verbatim to every Solr API request.
  const extraSolrParams = useMemo(() => {
    const entries = Object.entries(router.query).filter(([k]) => !NUQS_KEYS.has(k));
    return entries.length > 0 ? (Object.fromEntries(entries) as Record<string, string | string[]>) : null;
  }, [router.query]);

  const { params, start, results, handlers } = useSearchPage(extraSolrParams);
  const searchParams = toApiParams(params, start, extraSolrParams);
  const { highlights, isFetchingHighlights } = useHighlights(searchParams, params.showHighlights);
  const { isOpen: isLibOpen, onOpen: onOpenLib, onClose: onCloseLib } = useDisclosure();
  const histogramContainerRef = useRef<HTMLDivElement>(null);
  const [isPrint] = useMediaQuery('print');

  useScrollRestoration();

  // Bug 1: form submit handler so Enter key triggers search
  const handleSearchSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const q = (new FormData(e.currentTarget).get('q') as string) ?? params.q;
      if (q.length === 0) {
        return;
      }
      void handlers.onSubmit(q);
    },
    [handlers, params.q],
  );

  const handleSortChange = useCallback(
    (sort: SolrSort) => {
      void handlers.onSort([sort]);
    },
    [handlers],
  );

  // Facet filter updates include fq_* dynamic keys that nuqs does not manage.
  // Merge into the full URL params and push via router, matching FacetFilters behavior.
  const handleFacetQueryUpdate = useCallback(
    (queryUpdates: Partial<IADSApiSearchParams>) => {
      const current = parseQueryFromUrl(router.asPath);
      const search = makeSearchParams({ ...current, ...queryUpdates, p: 1 });
      void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
    },
    [router],
  );

  const loading = results.isLoading;
  const noResults = !loading && !results.isError && results.numFound === 0;
  const hasResults = !loading && !results.isError && results.numFound > 0;
  const showFilters = !isPrint;
  const showListActions = !isPrint && (loading || hasResults);
  // Bug 4: dynamic page title
  const pageTitle = params.q ? `${params.q} - ${BRAND_NAME_FULL} Search` : `${BRAND_NAME_FULL} Search`;

  return (
    <Box>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Stack direction="column" spacing={10}>
        {/* Bug 1+4: form wrapper enables Enter key submit; HideOnPrint restores original layout */}
        <HideOnPrint pt={10}>
          <form method="get" action="/search" onSubmit={handleSearchSubmit}>
            <Flex direction="column" width="full">
              {/* Bug 4: showBackLinkAs and NumFound restored */}
              <SearchBar query={params.q} isLoading={loading} showBackLinkAs="new_search" />
              <NumFound count={results.numFound} isLoading={loading} />
            </Flex>
            <FacetFilters mt="2" />
          </form>
          <Box ref={histogramContainerRef} />
        </HideOnPrint>
        <Flex direction="row" gap={{ base: 0, lg: 10 }} width="full">
          {/* Bug 2+3: SearchFacetFilters with mobile drawer and YearHistogramSlider */}
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
                    onSearchFacetSubmission={handleFacetQueryUpdate}
                    histogramContainerRef={histogramContainerRef}
                    searchParams={searchParams}
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
                      onOpenAddToLibrary={onOpenLib}
                      isLoading={results.isLoading}
                      currentSort={params.sort[0] as SolrSort}
                      showHighlights={params.showHighlights}
                      onToggleHighlights={handlers.onToggleHighlights}
                    />
                  </ErrorBoundary>
                )}
              </QueryErrorResetBoundary>
            ) : null}
            <VisuallyHidden as="h2" id="search-form-title">
              Search Results
            </VisuallyHidden>
            {noResults ? <NoResultsMsg /> : null}
            <SearchResultsList
              docs={results.docs}
              numFound={results.numFound}
              isLoading={results.isLoading}
              isError={results.isError}
              indexStart={start}
              rows={params.rows}
              highlights={highlights}
              showHighlights={params.showHighlights}
              isFetchingHighlights={isFetchingHighlights}
            />
            <Pagination
              page={params.p}
              totalResults={results.numFound}
              numPerPage={params.rows as NumPerPageType}
              isLoading={results.isLoading}
              onNext={(nextPage) => void handlers.onPageChange(nextPage)}
              onPrevious={(prevPage) => void handlers.onPageChange(prevPage)}
              onPageSelect={(page) => void handlers.onPageChange(page)}
              onPerPageSelect={(rows) => void handlers.onPerPageChange(rows)}
              skipRouting
              noLinks
            />
          </Box>
        </Flex>
      </Stack>
      <AddToLibraryModal isOpen={isLibOpen} onClose={onCloseLib} />
    </Box>
  );
};

// Bug 2+3: Mobile drawer + YearHistogramSlider, ported from master and adapted for nuqs params
const SearchFacetFilters = (props: {
  histogramContainerRef?: RefObject<HTMLDivElement>;
  onSearchFacetSubmission: (queryUpdates: Partial<IADSApiSearchParams>) => void;
  searchParams: IADSApiSearchParams;
}) => {
  const { onSearchFacetSubmission, histogramContainerRef, searchParams } = props;
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
              <SearchFacets onQueryUpdate={onSearchFacetSubmission} params={searchParams} />
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
                params={searchParams}
                onExpand={() => setHistogramExpanded((state) => !state)}
                expanded={true}
                width={histogramContainerRef?.current?.offsetWidth || 200}
                height={125}
              />
            </Box>
          </Portal>
        ) : (
          <YearHistogramSlider
            onQueryUpdate={onSearchFacetSubmission}
            params={searchParams}
            onExpand={() => setHistogramExpanded((state) => !state)}
            expanded={false}
            width={200}
            height={125}
          />
        )}
        <SearchFacets onQueryUpdate={onSearchFacetSubmission} params={searchParams} />
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

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
