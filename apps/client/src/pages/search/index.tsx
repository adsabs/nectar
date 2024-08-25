import { CheckCircleIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
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
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { AxiosError } from 'axios';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { omit } from 'ramda';
import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useIsClient } from 'src/lib';

import { IADSApiSearchParams, IADSApiSearchResponse, SolrSort } from '@/api';
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
import { FacetFilters } from '@/components/SearchFacet/FacetFilters';
import { IYearHistogramSliderProps } from '@/components/SearchFacet/YearHistogramSlider';
import { BRAND_NAME_FULL } from '@/config';
import { SOLR_ERROR, useSolrError } from '@/lib/useSolrError';
import { logger } from '@/logger';
import { AppState, useStore, useStoreApi } from '@/store';
import { NumPerPageType } from '@/types';
import { makeSearchParams } from '@/utils';

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
  clearAllSelected: (state: AppState) => state.clearAllSelected,
  query: (state: AppState) => state.query,
};

const omitP = omit(['p']);

const SearchPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  params,
  docs,
  error,
  numFound,
}) => {
  const router = useRouter();
  const isLoading = false;
  const isFetching = false;
  const isSuccess = true;

  const store = useStoreApi();
  const storeNumPerPage = useStore(selectors.numPerPage);
  const setQuery = useStore(selectors.setQuery);
  const updateQuery = useStore(selectors.updateQuery);
  const submitQuery = useStore(selectors.submitQuery);
  const setNumPerPage = useStore(selectors.setNumPerPage);
  const setDocs = useStore(selectors.setDocs);
  const clearSelectedDocs = useStore(selectors.clearAllSelected);

  const [isPrint] = useMediaQuery('print'); // use to hide elements when printing

  // needed by histogram for positioning and styling
  const [histogramExpanded, setHistogramExpanded] = useState(false);
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void router.replace({ pathname: '/search', search: makeSearchParams(params) }, undefined, { shallow: true });
  }, []);

  useEffect(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth - 20);
    }
  }, [ref]);

  const isClient = useIsClient();

  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  // on Sort change handler
  const handleSortChange = async (sort: SolrSort) => {
    const query = store.getState().query;
    if (query.q.length === 0) {
      // if query is empty, do not submit search
      return;
    }

    // generate search string and trigger page transition, also update store
    const search = makeSearchParams({ ...params, ...query, sort, p: 1 });
    await router.push({ pathname: router.pathname, search }, null, {
      scroll: false,
    });
  };

  // On submission handler
  const handleOnSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
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
    const search = makeSearchParams({
      ...params,
      ...query,
      q,
      p: 1,
      n: storeNumPerPage,
    });

    if (router.asPath.includes(search)) {
      logger.debug('Search query is the same as the current query, not navigating');
      return;
    }

    await router.push({ pathname: router.pathname, search }, null, {
      scroll: false,
    });
  };

  /**
   * When updating perPage, this updates the store with both the current
   * numPerPage value and the current query
   */
  const handlePerPageChange = async (numPerPage: NumPerPageType) => {
    // should reset to the first page on numPerPage update
    updateQuery({ start: 0, rows: numPerPage });
    setNumPerPage(numPerPage);
    const search = makeSearchParams({
      ...params,
      ...store.getState().query,
      n: numPerPage,
    });
    await router.push({ pathname: router.pathname, search }, null, {
      scroll: false,
    });
  };

  const handleSearchFacetSubmission = (queryUpdates: Partial<IADSApiSearchParams>) => {
    const search = makeSearchParams({
      ...params,
      ...queryUpdates,
      p: 1,
      n: storeNumPerPage,
    });

    // clear current docs on filter change
    clearSelectedDocs();

    void router.push({ pathname: router.pathname, search }, null, {
      scroll: false,
      shallow: true,
    });
  };

  const handleToggleExpand = () => {
    setHistogramExpanded((prev) => !prev);
  };

  // conditions
  const loading = isLoading || isFetching;
  const noResults = !loading && isSuccess && numFound === 0;
  const hasResults = !loading && isSuccess && numFound > 0;
  const isHistogramExpanded = histogramExpanded && !isPrint && isClient && hasResults;
  const showFilters = !isPrint && isClient && hasResults;
  const showListActions = !isPrint && (loading || hasResults);

  return (
    <Box>
      <Head>
        <title>{`${params.q} - ${BRAND_NAME_FULL} Search`}</title>
      </Head>
      <Stack direction="column" aria-labelledby="search-form-title" spacing="10" ref={ref}>
        <HideOnPrint pt={10}>
          <form method="get" action="/search" onSubmit={handleOnSubmit}>
            <Flex direction="column" width="full">
              <SearchBar isLoading={isLoading} />
              <NumFound count={numFound} isLoading={isLoading} />
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
        <Flex direction="row" gap={10} width="full">
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

            {error ? (
              <Center aria-labelledby="search-form-title" mt={4}>
                <SearchErrorAlert error={error.response} />
              </Center>
            ) : null}

            {noResults ? <NoResultsMsg /> : null}
            {loading ? <ItemsSkeleton count={storeNumPerPage} /> : null}
            {docs && (
              <>
                <SimpleResultList
                  docs={docs}
                  indexStart={params.start}
                  useNormCite={params.sort[0].startsWith('citation_count_norm')}
                />
                {!isPrint && (
                  <Pagination
                    numPerPage={storeNumPerPage}
                    page={params.p}
                    totalResults={numFound}
                    onPerPageSelect={handlePerPageChange}
                  />
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

const omitUnsafeQueryParams = omit(['fl', 'start', 'rows']);
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  logger.debug({ req: ctx.req }, 'Search page request');
  const { query, response, error } = await ctx.req.search();

  if (response) {
    return {
      props: {
        dehydratedAppState: {
          query,
          latestQuery: query,
          numPerPage: query.rows,
        } as AppState,
        page: ctx.query.p ?? 1,
        params: query,
        docs: response.response.docs,
        numFound: response.response.numFound,
        error: null,
      },
    };
  }

  return {
    props: {
      dehydratedAppState: {
        query,
        latestQuery: query,
        numPerPage: query.rows,
      } as AppState,
      error: {
        message: error,
        response: response,
      },
      page: ctx.query.p ?? 1,
      params: query,
      numFound: 0,
      docs: [],
    },
  };
};

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
      <AlertTitle>{getMsg()}</AlertTitle>
      <AlertDescription>{data.solrMsg}</AlertDescription>
    </Alert>
  );
};
