import dynamic from 'next/dynamic';
import { IYearHistogramSliderProps } from '@/components/SearchFacet/YearHistogramSlider';
import { ISearchFacetsProps } from '@/components/SearchFacet';
import { AppState, useStore, useStoreApi } from '@/store';
import { last, omit, path } from 'ramda';
import { GetServerSideProps, NextPage } from 'next';
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
import { FormEventHandler, RefObject, useEffect, useRef, useState } from 'react';
import { useIsClient } from '@/lib/useIsClient';
import { useScrollRestoration } from '@/lib/useScrollRestoration';
import { NumPerPageType } from '@/types';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';
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
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { SEARCH_API_KEYS, useSearch } from '@/api/search/search';
import { defaultParams } from '@/api/search/models';
import { solrDefaultSortDirection, SolrSort, SolrSortField } from '@/api/models';
import { useApplyBoostTypeToParams } from '@/lib/useApplyBoostTypeToParams';
import { SearchErrorAlert } from '@/components/SolrErrorAlert/SolrErrorAlert';

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
  setQuery: (state: AppState) => state.setQuery,
  updateQuery: (state: AppState) => state.updateQuery,
  submitQuery: (state: AppState) => state.submitQuery,
  setNumPerPage: (state: AppState) => state.setNumPerPage,
  numPerPage: (state: AppState) => state.numPerPage,
  setDocs: (state: AppState) => state.setDocs,
  showFilters: (state: AppState) => state.settings.searchFacets.open,
  toggleSearchFacetsOpen: (state: AppState) => state.toggleSearchFacetsOpen,
  resetSearchFacets: (state: AppState) => state.resetSearchFacets,
  clearAllSelected: (state: AppState) => state.clearAllSelected,
  query: (state: AppState) => state.query,
};

const omitP = omit(['p']);

const SearchPage: NextPage = () => {
  const router = useRouter();

  const store = useStoreApi();
  const storeNumPerPage = useStore(selectors.numPerPage);
  const setQuery = useStore(selectors.setQuery);
  const updateQuery = useStore(selectors.updateQuery);
  const submitQuery = useStore(selectors.submitQuery);
  const setNumPerPage = useStore(selectors.setNumPerPage);
  const setDocs = useStore(selectors.setDocs);
  const clearSelectedDocs = useStore(selectors.clearAllSelected);
  const sort = useStore(selectors.query).sort[0];

  const queryClient = useQueryClient();
  const queries = queryClient.getQueriesData<IADSApiSearchResponse>([SEARCH_API_KEYS.primary]);
  const numFound = queries.length > 1 ? path<number>(['1', 'response', 'numFound'], last(queries)) : null;
  const [isPrint] = useMediaQuery('print');

  // parse the query params from the URL, this should match what the server parsed
  const parsedParams = parseQueryFromUrl(router.asPath);
  const { params } = useApplyBoostTypeToParams({
    params: {
      ...defaultParams,
      ...parsedParams,
      rows: storeNumPerPage,
      start: calculateStartIndex(parsedParams.p, storeNumPerPage, numFound),
    },
  });

  const searchParams = omitP(params) as IADSApiSearchParams;
  const { data, isSuccess, isLoading, isFetching, error, isError } = useSearch(searchParams);
  const histogramContainerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  // Scroll restoration hook - automatically restores scroll position when returning from abstract page
  useScrollRestoration();

  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

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
    if (data?.docs.length > 0) {
      setDocs(data.docs.map((d) => d.bibcode));
      setQuery(searchParams);
      submitQuery();
    }
  }, [data]);

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
  const noResults = !loading && isSuccess && data?.numFound === 0;
  const hasResults = !loading && isSuccess && data?.numFound > 0;
  const showFilters = !isPrint && isClient && hasResults;
  const showListActions = !isPrint && (loading || hasResults);

  return (
    <Box>
      <Head>
        <title>{`${params.q} - ${BRAND_NAME_FULL} Search`}</title>
      </Head>
      <Stack direction="column" aria-labelledby="search-form-title" spacing="10">
        <HideOnPrint pt={10}>
          <form method="get" action="/search" onSubmit={handleOnSubmit}>
            <Flex direction="column" width="full">
              <SearchBar isLoading={loading} />
              <NumFound count={data?.numFound} isLoading={loading} />
            </Flex>
            <FacetFilters mt="2" />
          </form>
          <Box ref={histogramContainerRef} />
        </HideOnPrint>
        <Flex direction="row" gap={{ base: 0, lg: 10 }} width="full">
          {showFilters ? (
            <SearchFacetFilters
              onSearchFacetSubmission={handleSearchFacetSubmission}
              histogramContainerRef={histogramContainerRef}
            />
          ) : null}
          <Box width="full">
            {showListActions ? (
              <ListActions
                onSortChange={handleSortChange}
                onOpenAddToLibrary={onOpenAddToLibrary}
                isLoading={isLoading}
              />
            ) : null}
            <VisuallyHidden as="h2" id="search-form-title">
              Search Results
            </VisuallyHidden>

            {noResults ? <NoResultsMsg /> : null}
            {loading ? <ItemsSkeleton count={storeNumPerPage} /> : null}
            <PartialResultsWarning params={searchParams} />

            {data && (
              <>
                <SimpleResultList
                  docs={data.docs}
                  indexStart={params.start}
                  useNormCite={sort.startsWith('citation_count_norm')}
                />
                {!isPrint && (
                  <Pagination
                    numPerPage={storeNumPerPage}
                    page={params.p as number}
                    totalResults={data.numFound}
                    onPerPageSelect={handlePerPageChange}
                  />
                )}
              </>
            )}
          </Box>
        </Flex>
      </Stack>
      {isError ? (
        <Center aria-labelledby="search-form-title" mt={4}>
          <SearchErrorAlert error={error} />
        </Center>
      ) : null}
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
              borderBottomRadius="none"
              size="xs"
              type="button"
              onClick={onOpenFacet}
              top="240px"
              left="-28px"
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
      <Flex as="aside" aria-labelledby="search-facets" minWidth="250px" direction="column">
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
          borderBottomRadius="none"
          size="xs"
          type="button"
          onClick={handleToggleFilters}
          top="240px"
          left="-28px"
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
 *
 * @param props
 * @constructor
 */
const PartialResultsWarning = (props: { params: IADSApiSearchParams }) => {
  const { params } = props;
  const { data: isPartialResults, isError } = useSearch(params, {
    select: (data) => data.responseHeader?.partialResults,
  });

  if (!isPartialResults || isError) {
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

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
