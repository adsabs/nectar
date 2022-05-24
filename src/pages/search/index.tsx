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
import { ItemsSkeleton, ListActions, NumFound, Pagination, SearchBar, SimpleResultList } from '@components';
import { calculateStartIndex } from '@components/ResultList/Pagination/usePagination';
import { APP_DEFAULTS } from '@config';
import { AppState, createStore, useStore, useStoreApi } from '@store';
import { NumPerPageType } from '@types';
import { isApiSearchResponse, makeSearchParams, parseQueryFromUrl, setupApiSSR } from '@utils';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { omit } from 'ramda';
import { FormEventHandler, useEffect } from 'react';
import { dehydrate, QueryClient } from 'react-query';

const SearchPage: NextPage = () => {
  const router = useRouter();
  const store = useStoreApi();
  const storeNumPerPage = useStore((state) => state.numPerPage);

  const parsedParams = parseQueryFromUrl(router.query);
  const params = {
    ...defaultParams,
    ...parsedParams,
    rows: storeNumPerPage,
    start: calculateStartIndex(parsedParams.p, storeNumPerPage),
  };
  const { data, isLoading, error } = useSearch(omit(['p'], params), { structuralSharing: true });

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
          <ListActions onSortChange={handleSortChange} />
        </Box>
      </form>

      <VisuallyHidden as="h2" id="search-form-title">
        Search Results
      </VisuallyHidden>
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

  const params: IADSApiSearchParams = {
    ...defaultParams,
    ...query,
    q: query.q.length === 0 ? '*:*' : query.q,
    start: calculateStartIndex(page, APP_DEFAULTS.RESULT_PER_PAGE),
  };

  console.log(params);

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
