import {
  defaultParams,
  fetchSearch,
  getSearchParams,
  getSearchStatsParams,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  SEARCH_API_KEYS,
  searchKeys,
  SolrSort,
  useSearch,
} from '@/api';
import { CheckCircleIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Code,
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
  useDisclosure,
  useMediaQuery,
  VisuallyHidden,
} from '@chakra-ui/react';
import {
  AddToLibraryModal,
  CustomInfoMessage,
  HideOnPrint,
  ISearchFacetsProps,
  ItemsSkeleton,
  ListActions,
  NumFound,
  Pagination,
  SearchBar,
  SimpleLink,
  SimpleResultList,
} from '@/components';
import { calculateStartIndex } from '@/components/ResultList/Pagination/usePagination';
import { FacetFilters } from '@/components/SearchFacet/FacetFilters';
import { IYearHistogramSliderProps } from '@/components/SearchFacet/YearHistogramSlider';
import { APP_DEFAULTS } from '@/config';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { useIsClient } from 'src/lib';
import { composeNextGSSP } from '@/ssr-utils';
import { AppState, createStore, useStore, useStoreApi } from '@/store';
import { NumPerPageType } from '@/types';
import { makeSearchParams, parseAPIError, parseQueryFromUrl } from '@/utils';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { last, omit, path } from 'ramda';
import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { dehydrate, QueryClient, useQueryClient } from '@tanstack/react-query';
import { SOLR_ERROR, useSolrError } from '@/lib/useSolrError';
import { AxiosError } from 'axios';
import { logger } from '@/logger';

const YearHistogramSlider = dynamic<IYearHistogramSliderProps>(
  () => import('@/components/SearchFacet/YearHistogramSlider').then((mod) => mod.YearHistogramSlider),
  { ssr: false },
);

const SearchFacets = dynamic<ISearchFacetsProps>(
  () => import('@/components/SearchFacet').then((mod) => mod.SearchFacets),
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

  const queryClient = useQueryClient();
  const queries = queryClient.getQueriesData<IADSApiSearchResponse>([SEARCH_API_KEYS.primary]);
  const numFound = queries.length > 1 ? path<number>(['1', 'response', 'numFound'], last(queries)) : null;
  const [isPrint] = useMediaQuery('print'); // use to hide elements when printing

  // parse the query params from the URL, this should match what the server parsed
  const parsedParams = parseQueryFromUrl(router.asPath);
  const params = {
    ...defaultParams,
    ...parsedParams,
    rows: storeNumPerPage,
    start: calculateStartIndex(parsedParams.p, storeNumPerPage, numFound),
  };

  const { data, isSuccess, isLoading, isFetching, error, isError } = useSearch(omitP(params));

  // needed by histogram for positioning and styling
  const [histogramExpanded, setHistogramExpanded] = useState(false);
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth - 20);
    }
  }, [ref]);

  const isClient = useIsClient();

  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  // on Sort change handler
  const handleSortChange = (sort: SolrSort) => {
    const query = store.getState().query;
    if (query.q.length === 0) {
      // if query is empty, do not submit search
      return;
    }

    // generate search string and trigger page transition, also update store
    const search = makeSearchParams({ ...params, ...query, sort, p: 1 });
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

    // generate a URL search string and trigger a page transition, and update store
    const search = makeSearchParams({ ...params, ...query, q, p: 1 });
    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  // Update the store when we have data
  useEffect(() => {
    if (data?.docs.length > 0) {
      setDocs(data.docs.map((d) => d.bibcode));
      setQuery(omitP(params));
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
    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  const handleToggleExpand = () => {
    setHistogramExpanded((prev) => !prev);
  };

  // conditions
  const loading = isLoading || isFetching;
  const noResults = !loading && isSuccess && data?.numFound === 0;
  const hasResults = !loading && isSuccess && data?.numFound > 0;
  const isHistogramExpanded = histogramExpanded && !isPrint && isClient && hasResults;
  const showFilters = !isPrint && isClient && hasResults;
  const showListActions = !isPrint && (loading || hasResults);

  return (
    <>
      <Head>
        <title>{`${params.q} | NASA Science Explorer - Search Results`}</title>
      </Head>
      <Stack direction="column" aria-labelledby="search-form-title" spacing="10" ref={ref}>
        <HideOnPrint pt={10}>
          <form method="get" action="/search" onSubmit={handleOnSubmit}>
            <Flex direction="column" width="full">
              <SearchBar isLoading={isLoading} />
              <NumFound count={data?.numFound} isLoading={isLoading} />
            </Flex>
            <FacetFilters mt="2" />
          </form>
        </HideOnPrint>
        {isHistogramExpanded ? (
          <YearHistogramSlider
            onQueryUpdate={handleSearchFacetSubmission}
            onExpand={handleToggleExpand}
            expanded
            width={width}
            height={125}
          />
        ) : null}
        <Flex direction="row" gap={10}>
          <Box display={{ base: 'none', lg: 'block' }}>
            {/* hide facets if screen is too small */}
            {showFilters ? (
              <SearchFacetFilters
                histogramExpanded={histogramExpanded}
                onExpandHistogram={handleToggleExpand}
                onSearchFacetSubmission={handleSearchFacetSubmission}
              />
            ) : null}
          </Box>
          <Box flexGrow={2}>
            {showListActions ? (
              <form>
                <fieldset disabled={isLoading}>
                  <ListActions onSortChange={handleSortChange} onOpenAddToLibrary={onOpenAddToLibrary} />
                </fieldset>
              </form>
            ) : null}
            <VisuallyHidden as="h2" id="search-form-title">
              Search Results
            </VisuallyHidden>

            {noResults ? <NoResultsMsg /> : null}
            {loading ? <ItemsSkeleton count={storeNumPerPage} /> : null}

            {data && (
              <>
                <SimpleResultList docs={data.docs} indexStart={params.start} />
                {!isPrint && (
                  <Pagination
                    numPerPage={storeNumPerPage}
                    page={params.p}
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
    </>
  );
};

const SearchFacetFilters = (props: {
  histogramExpanded: boolean;
  onExpandHistogram: () => void;
  onSearchFacetSubmission: (queryUpdates: Partial<IADSApiSearchParams>) => void;
}) => {
  const { histogramExpanded, onSearchFacetSubmission, onExpandHistogram } = props;
  const showFilters = useStore(selectors.showFilters);
  const handleToggleFilters = useStore(selectors.toggleSearchFacetsOpen);
  const handleResetFilters = useStore(selectors.resetSearchFacets);

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
        {!histogramExpanded ? (
          <YearHistogramSlider
            onQueryUpdate={onSearchFacetSubmission}
            onExpand={onExpandHistogram}
            expanded={false}
            width={200}
            height={125}
          />
        ) : null}
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
    title={<>Sorry no results were found</>}
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
export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  try {
    const { p: page, ...query } = parseQueryFromUrl<{ p: string }>(ctx.req.url);
    const queryClient = new QueryClient();

    // prime the search with a small query to get the current numFound
    let primer = null;
    if (page > 1) {
      const primerParams = getSearchParams({ ...query, start: 0, rows: 1, fl: ['id'] });
      primer = await queryClient.fetchQuery({
        queryKey: searchKeys.primary(primerParams),
        queryFn: fetchSearch,
        meta: { params: primerParams },
      });
    }

    const params: IADSApiSearchParams = getSearchParams({
      ...query,
      q: query.q.length === 0 ? '*:*' : query.q,
      start: calculateStartIndex(page, APP_DEFAULTS.RESULT_PER_PAGE, primer?.response.numFound),
    });

    // omit fields from queryKey
    const { fl, ...cleanedParams } = params;

    // prefetch the citation counts for this query
    if (/^citation_count(_norm)?/.test(params.sort[0])) {
      await queryClient.prefetchQuery({
        queryKey: searchKeys.stats(cleanedParams),
        queryFn: fetchSearch,
        meta: { params: getSearchStatsParams(params, params.sort[0]) },
      });
    }
    const initialState = createStore().getState();

    try {
      // primary query prefetch
      const primaryResult = await queryClient.fetchQuery({
        queryKey: [SEARCH_API_KEYS.primary],
        queryFn: fetchSearch,
        queryHash: JSON.stringify(searchKeys.primary(omit(['fl'], params) as IADSApiSearchParams)),
        meta: { params },
      });

      return {
        props: {
          dehydratedState: dehydrate(queryClient),
          dehydratedAppState: {
            query: params,
            latestQuery: params,
            docs: {
              ...initialState.docs,
              current: primaryResult.response.docs.map((d) => d.bibcode),
            },
          } as AppState,
        },
      };
    } catch (error) {
      logger.error({ msg: 'error fetching search results', error: error });
      return {
        props: {
          dehydratedState: dehydrate(queryClient),
          dehydratedAppState: {
            query: params,
            latestQuery: params,
          } as AppState,
          pageError: parseAPIError(error),
        },
      };
    }
  } catch (e) {
    logger.error({ msg: 'Search Page Error', error: e });
    return {
      props: {
        pageError: parseAPIError(e),
      },
    };
  }
});

export default SearchPage;

const SearchErrorAlert = ({ error }: { error: AxiosError<IADSApiSearchResponse> | Error }) => {
  const data = useSolrError(error);

  const getMsg = useCallback(() => {
    switch (data?.error) {
      case SOLR_ERROR.FIELD_NOT_FOUND:
        return (
          <Text>
            Unknown field: <Code>{data?.field}</Code>
          </Text>
        );
      case SOLR_ERROR.SYNTAX_ERROR:
        return <Text>There was an issue parsing the query</Text>;
      default:
        return <Text>There was an issue performing the search, please check your query</Text>;
    }
  }, [data.error]);

  return (
    <Alert status="error">
      <AlertIcon />
      {getMsg()}
    </Alert>
  );
};
