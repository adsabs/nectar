import {
  defaultParams,
  fetchSearch,
  getSearchStatsParams,
  IADSApiSearchParams,
  searchKeys,
  SEARCH_API_KEYS,
  SolrSort,
} from '@api';
import { Box, Flex, Stack } from '@chakra-ui/layout';
import { Alert, AlertIcon, Code, VisuallyHidden } from '@chakra-ui/react';
import { ItemsSkeleton, ListActions, NumFound, Pagination, SearchBar, SimpleResultList } from '@components';
import { useSearchController } from '@hooks/useSearchController';
import { AppState, createStore, useStore } from '@store';
import { isApiSearchResponse, parseQueryFromUrl, setupApiSSR } from '@utils';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { omit } from 'ramda';
import { FormEventHandler } from 'react';
import { dehydrate, QueryClient } from 'react-query';

// selectors
const updateQuerySelector = (state: AppState) => state.updateQuery;
const submitQuerySelector = (state: AppState) => state.submitQuery;

const SearchPage: NextPage<{ page: number }> = ({ page }) => {
  const updateQuery = useStore(updateQuerySelector);
  const submitQuery = useStore(submitQuerySelector);

  const [{ data, isFetching, error }, { getPaginationProps }] = useSearchController({ ssrPage: page });

  const handleSortChange = (sort: SolrSort[]) => {
    updateQuery({ sort });
    submitQuery();
  };

  const handleOnSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    submitQuery();
  };

  const pagination = getPaginationProps();

  return (
    <Box aria-labelledby="search-form-title" my={16}>
      <Head>
        {/* todo: add the query here in the title */}
        <title> | NASA Science Explorer - Search Results</title>
      </Head>

      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <Flex direction="column" width="full">
          <SearchBar isLoading={isFetching} />
          <NumFound count={data?.numFound} isLoading={isFetching} />
        </Flex>
        <Box mt={5}>
          <ListActions onSortChange={handleSortChange} />
        </Box>
      </form>

      <VisuallyHidden as="h2" id="search-form-title">
        Search Results
      </VisuallyHidden>

      {isFetching && <ItemsSkeleton count={pagination.numPerPage} />}
      {data && (
        <>
          <SimpleResultList docs={data.docs} indexStart={pagination.startIndex} />
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
    start: (page - 1) * defaultParams.rows,
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
        page,
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
