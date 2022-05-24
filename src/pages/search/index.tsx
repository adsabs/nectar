import {
  defaultParams,
  fetchSearch,
  getSearchStatsParams,
  IADSApiSearchParams,
  searchKeys,
  SEARCH_API_KEYS,
  SolrSort,
  useSearch,
} from '@api';
import { Box, Flex, Stack } from '@chakra-ui/layout';
import { Alert, AlertIcon, Code, VisuallyHidden } from '@chakra-ui/react';
import { ListActions, NumFound, Pagination, SearchBar, SimpleResultList } from '@components';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { AppState, createStore, useStore, useStoreApi } from '@store';
import { isApiSearchResponse, makeSearchParams, parseQueryFromUrl, setupApiSSR } from '@utils';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { omit } from 'ramda';
import { FormEventHandler } from 'react';
import { dehydrate, QueryClient } from 'react-query';

// selectors
const updateQuerySelector = (state: AppState) => state.updateQuery;
const submitQuerySelector = (state: AppState) => state.submitQuery;

const SearchPage: NextPage<{ params: IADSApiSearchParams; page: number }> = ({ params, page }) => {
  const updateQuery = useStore(updateQuerySelector);
  const submitQuery = useStore(submitQuerySelector);
  const router = useRouter();
  const store = useStoreApi();

  const { data, error } = useSearch(params);

  const { getPaginationProps } = usePagination({
    numFound: data?.numFound,
    page,
    onStateChange: (pagination, { page: newPage }) => {
      if (pagination.startIndex !== params.start && newPage !== page) {
        updateQuery({ start: pagination.startIndex });
        submitQuery();
        const search = makeSearchParams({ ...params, p: newPage });
        void router.push({ pathname: router.pathname, search }, null, { scroll: true });
      }
    },
  });
  const pagination = getPaginationProps();

  const handleSortChange = (sort: SolrSort[]) => {
    updateQuery({ sort });
    submitQuery();
    const search = makeSearchParams({ ...params, ...store.getState().query, sort, p: 1 });
    void router.push({ pathname: router.pathname, search }, null, { scroll: false });
  };

  const handleOnSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    submitQuery();
    const search = makeSearchParams({ ...params, ...store.getState().query, p: 1 });
    void router.push({ pathname: router.pathname, search }, null, { scroll: false });
  };

  return (
    <Box aria-labelledby="search-form-title" my={16}>
      <Head>
        <title>{params.q} | NASA Science Explorer - Search Results</title>
      </Head>

      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <Flex direction="column" width="full">
          <SearchBar />
          <NumFound count={data?.numFound} />
        </Flex>
        <Box mt={5}>
          <ListActions onSortChange={handleSortChange} />
        </Box>
      </form>

      <VisuallyHidden as="h2" id="search-form-title">
        Search Results
      </VisuallyHidden>

      {data && (
        <>
          <SimpleResultList docs={data.docs} indexStart={params.start} />
          <Pagination {...pagination} totalResults={data.numFound} />
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

  const params: IADSApiSearchParams = {
    ...defaultParams,
    ...query,
    q: query.q.length === 0 ? '*:*' : query.q,
    start: (page - 1) * defaultParams.rows + 1,
  };

  // omit fields from queryKey
  const { fl, ...cleanedParams } = params;
  const queryClient = new QueryClient();

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
        params,
        page,
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
        params,
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
