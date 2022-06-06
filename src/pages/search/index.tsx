import {
  defaultParams,
  fetchSearch,
  getSearchParams,
  getSearchStatsParams,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  searchKeys,
  SEARCH_API_KEYS,
  SolrSort,
  useSearch,
} from '@api';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { Box, Flex, HStack, List, ListIcon, ListItem, Stack } from '@chakra-ui/layout';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Code, VisuallyHidden } from '@chakra-ui/react';
import { ItemsSkeleton, ListActions, NumFound, Pagination, SearchBar, SimpleLink, SimpleResultList } from '@components';
import { calculateStartIndex } from '@components/ResultList/Pagination/usePagination';
import { APP_DEFAULTS } from '@config';
import { AppState, createStore, useStore, useStoreApi } from '@store';
import { NumPerPageType } from '@types';
import { isApiSearchResponse, makeSearchParams, parseQueryFromUrl, setupApiSSR } from '@utils';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { last, omit, path } from 'ramda';
import { FormEventHandler, useEffect } from 'react';
import { dehydrate, QueryClient, useQueryClient } from 'react-query';

const SearchPage: NextPage = () => {
  const router = useRouter();
  const store = useStoreApi();
  const storeNumPerPage = useStore((state) => state.numPerPage);
  const queryClient = useQueryClient();
  const queries = queryClient.getQueriesData<IADSApiSearchResponse>(SEARCH_API_KEYS.primary);
  const numFound = queries.length > 1 ? path<number>(['1', 'response', 'numFound'], last(queries)) : null;

  const parsedParams = parseQueryFromUrl(router.query);
  const params = {
    ...defaultParams,
    ...parsedParams,
    rows: storeNumPerPage,
    start: calculateStartIndex(parsedParams.p, storeNumPerPage, numFound),
  };

  const { data, isSuccess, isLoading, error } = useSearch(omit(['p'], params));

  const handleSortChange = (sort: SolrSort[]) => {
    const search = makeSearchParams({ ...params, ...store.getState().query, sort, p: 1 });
    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  const handleOnSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const search = makeSearchParams({ ...params, ...store.getState().query, p: 1 });
    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  const setDocs = useStore((state) => state.setDocs);
  useEffect(() => {
    if (data?.docs.length > 0) {
      setDocs(data.docs.map((d) => d.bibcode));
    }
  }, [data]);

  const setNumPerPage = useStore((state) => state.setNumPerPage);
  const handlePerPageChange = (numPerPage: NumPerPageType) => {
    setNumPerPage(numPerPage);
  };

  return (
    <Box aria-labelledby="search-form-title" my={16}>
      <Head>
        <title>{params.q} | NASA Science Explorer - Search Results</title>
      </Head>

      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <Flex direction="column" width="full">
          <SearchBar isLoading={isLoading} />
          <NumFound count={data?.numFound} isLoading={isLoading} />
        </Flex>
        <Box mt={5}>
          {isSuccess && !isLoading && data.numFound > 0 && <ListActions onSortChange={handleSortChange} />}
        </Box>
      </form>

      <VisuallyHidden as="h2" id="search-form-title">
        Search Results
      </VisuallyHidden>
      {!isLoading && data.numFound === 0 && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          justifyContent="center"
          height="200px"
          backgroundColor="transparent"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Sorry no results were found for <Code children={params.q} />
          </AlertTitle>
          <AlertDescription>
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
          </AlertDescription>
        </Alert>
      )}
      {isLoading && <ItemsSkeleton count={storeNumPerPage} />}
      {data && (
        <>
          <SimpleResultList docs={data.docs} indexStart={params.start} />
          <Pagination
            numPerPage={storeNumPerPage}
            page={params.p}
            totalResults={data.numFound}
            onPerPageSelect={handlePerPageChange}
          />
        </>
      )}
      {error && (
        <Box aria-labelledby="search-form-title" my={16}>
          <SearchErrorAlert error={error} />
        </Box>
      )}
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { p: page, ...query } = parseQueryFromUrl<{ p: string }>(ctx.query);
  setupApiSSR(ctx);
  const queryClient = new QueryClient();

  // prime the search with a small query to get the current numFound
  let primer = null;
  if (page > 1) {
    const primerParams = { ...query, start: 0, rows: 1, fl: ['id'] };
    primer = await queryClient.fetchQuery({
      queryKey: SEARCH_API_KEYS.primary,
      queryFn: fetchSearch,
      queryHash: JSON.stringify(searchKeys.primary(omit(['fl'], primerParams))),
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
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.stats(cleanedParams),
      queryFn: fetchSearch,
      meta: { params: getSearchStatsParams(params, params.sort[0]) },
    }));
  }
  const initialState = createStore().getState();

  try {
    // primary query prefetch
    const primaryResult = await queryClient.fetchQuery({
      queryKey: SEARCH_API_KEYS.primary,
      queryFn: fetchSearch,
      queryHash: JSON.stringify(searchKeys.primary(omit(['fl'], params))),
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
  } catch (e) {
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        dehydratedAppState: {
          query: params,
          latestQuery: params,
        } as AppState,
      },
    };
  }
};

export default SearchPage;

const SearchErrorAlert = ({ error }: { error: unknown }) => {
  if (!error) {
    return null;
  }

  // Show a message about updating query if the it's a syntax error
  if (axios.isAxiosError(error) && error.response.status === 400 && isApiSearchResponse(error.response.data)) {
    const query = error.response.data.responseHeader.params.q;

    return (
      <Alert status="error">
        <AlertIcon />
        <Stack direction="row">
          <p>Unable to parse </p>
          <Code>{query}</Code>
          <p>please update, and try again</p>
        </Stack>
      </Alert>
    );
  }

  return (
    <Alert status="error">
      <AlertIcon />
      {axios.isAxiosError(error) && error.message}
    </Alert>
  );
};
