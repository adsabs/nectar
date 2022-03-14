import { IADSApiSearchParams, SolrSort } from '@api';
import { Box, Flex } from '@chakra-ui/layout';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { VisuallyHidden } from '@chakra-ui/visually-hidden';
import { ItemsSkeleton, ListActions, NumFound, SearchBar, SimpleResultList } from '@components';
import { Pagination } from '@components/ResultList/Pagination';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { AppState, createStore, useStore, useStoreApi } from '@store';
import { parseNumberAndClamp, parseQueryFromUrl } from '@utils';
import { searchKeys, useSearch } from '@_api/search';
import { defaultParams, getSearchStatsParams } from '@_api/search/models';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { equals, omit, pick } from 'ramda';
import { ChangeEvent, useEffect, useState } from 'react';
import { dehydrate, QueryClient } from 'react-query';

interface ISearchPageProps {
  searchParams: IADSApiSearchParams;
}

const useSearchQuery = (submitted: boolean, query: IADSApiSearchParams) => {
  const router = useRouter();
  const setLatestQuery = useStore((state) => state.setLatestQuery);
  const setDocs = useStore((state) => state.setDocs);

  const result = useSearch(query, {
    // we are allowing data to persist, but below the page will still show loading state
    // this is to keep stable data available for other hooks to use
    keepPreviousData: true,
    enabled: submitted,
    onSettled: () => {
      // omit superfluous params
      const params = omit(['fl', 'start', 'rows'], query);

      // update router with changed params
      void router.push({ pathname: router.pathname, query: { ...router.query, ...params } }, null, {
        shallow: true,
      });
    },
    onSuccess(data) {
      // set docs on success
      setDocs(data.docs.map((d) => d.bibcode));

      // update store with the latest (working) query
      setLatestQuery(query);
    },
  });

  return result;
};

const SearchPage: NextPage<ISearchPageProps> = () => {
  const updateQuery = useStore((state) => state.updateQuery);
  const query = useStoreApi().getState().query;

  const [submitted, setSubmitted] = useState(false);
  const { data, isSuccess, isError, isFetching, error } = useSearchQuery(submitted, query);

  // helper for submitting and updating query at the same time
  const updateAndSubmit = (params?: Partial<IADSApiSearchParams>) => {
    if (params) {
      updateQuery(params);
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 0);
  };

  // re-calculates pagination when numFound, page or numPerPage changes
  const pagination = usePagination({ numFound: data?.numFound });

  // on pagination updates we want to attempt another search
  useEffect(() => {
    updateAndSubmit({ start: pagination.startIndex, rows: pagination.numPerPage });
  }, [pagination.startIndex, pagination.numPerPage]);

  // update the page and query based on the incoming route params
  const router = useRouter();
  const routeChangeHandler = () => {
    const page = parseNumberAndClamp(router.query.p, 1);
    if (page !== pagination.page) {
      pagination.dispatch({ type: 'SET_PAGE', payload: page });
    }

    // only do updates when something has actually changed, since this handler
    // will call on all updates to the URL
    const parsedQuery = parseQueryFromUrl(router.query);
    if (!equals(pick(['q', 'sort'], parsedQuery), pick(['q', 'sort'], query))) {
      updateAndSubmit({ ...omit(['p'], router.query) });
    }
  };

  // add/remove route change handlers
  useEffect(() => {
    router.events.on('routeChangeComplete', routeChangeHandler);
    return () => router.events.off('routeChangeComplete', routeChangeHandler);
  }, [router]);

  // on form submission, but not otherwise (probably need more granular control)
  // we should clear the selected docs.  We'll probably want to not do this ordinal changes like sort
  const clearSelectedDocs = useStore((state) => state.clearSelected);
  const handleOnSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    // resets the page to 1
    pagination.dispatch({ type: 'RESET' });
    clearSelectedDocs();
    updateAndSubmit();
  };

  // trigger new search on sort change
  const handleSortChange = (sort: SolrSort[]) => {
    updateAndSubmit({ sort });
  };

  const isLoading = isFetching || submitted;

  return (
    <Box aria-labelledby="search-form-title" my={16}>
      <Head>
        <title>{query.q ?? ''} | NASA Science Explorer - Search Results</title>
      </Head>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <VisuallyHidden as="h2" id="search-form-title">
          Search Results
        </VisuallyHidden>
        <Flex direction="column" width="full">
          <SearchBar isLoading={isLoading} />
          {!isLoading && <NumFound count={data?.numFound ?? 0} />}
          {/* <Filters /> */}
        </Flex>
        <Box mt={5}>
          {isError && (
            <Alert status="error">
              <AlertIcon />
              {axios.isAxiosError(error) && error.message}
            </Alert>
          )}
          {isLoading && <ItemsSkeleton count={pagination.numPerPage} />}
          {isSuccess && !isLoading && <ListActions onSortChange={handleSortChange} />}
          {isSuccess && !isLoading && <SimpleResultList docs={data.docs} indexStart={pagination.startIndex} />}
          {isSuccess && !isLoading && <Pagination totalResults={data.numFound} {...pagination} />}
        </Box>
      </form>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const api = (await import('@_api/api')).default;
  const { fetchSearch } = await import('@_api/search');
  const { p: page, ...query } = parseQueryFromUrl(ctx.query);
  api.setToken(ctx.req.session.userData.access_token);

  const params: IADSApiSearchParams = {
    ...defaultParams,
    ...query,
    start: (page - 1) * defaultParams.rows,
  };

  // omit fields from queryKey
  const { fl, ...cleanedParams } = params;
  const queryClient = new QueryClient();

  // primary query prefetch
  const primaryResult = await queryClient.fetchQuery({
    queryKey: searchKeys.primary(cleanedParams),
    queryFn: fetchSearch,
    meta: { params },
  });

  // prefetch the citation counts for this query
  if (/^citation_count(_norm)?/.test(params.sort[0])) {
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.stats(cleanedParams),
      queryFn: fetchSearch,
      meta: { params: getSearchStatsParams(params, params.sort[0]) },
    }));
  }

  const initialState = createStore().getState();

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
      searchParams: params,
    },
  };
};

export default SearchPage;
