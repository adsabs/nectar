import { IADSApiSearchParams, SolrSort } from '@api';
import { Box, Flex, Stack } from '@chakra-ui/layout';
import { Alert, AlertIcon, Code } from '@chakra-ui/react';
import { VisuallyHidden } from '@chakra-ui/visually-hidden';
import { ItemsSkeleton, ListActions, NumFound, SearchBar, SimpleResultList } from '@components';
import { Pagination } from '@components/ResultList/Pagination';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { AppState, createStore, useStore, useStoreApi } from '@store';
import { isApiSearchResponse, parseNumberAndClamp, parseQueryFromUrl, setupApiSSR } from '@utils';
import { searchKeys, useSearch } from '@_api/search';
import { defaultParams, getSearchStatsParams } from '@_api/search/models';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import qs from 'qs';
import { omit } from 'ramda';
import { ChangeEvent, useEffect, useState } from 'react';
import { dehydrate, QueryClient } from 'react-query';
import { useDebouncedCallback } from 'use-debounce';

// selectors
const updateQuerySelector = (state: AppState) => state.updateQuery;
const setLatestQuerySelector = (state: AppState) => state.setLatestQuery;
const setDocsSelector = (state: AppState) => state.setDocs;

/**
 * hook that wraps useSearch
 */
const useSearchQuery = () => {
  const store = useStoreApi();
  const setLatestQuery = useStore(setLatestQuerySelector);
  const setDocs = useStore(setDocsSelector);
  const [query, setQuery] = useState(() => store.getState().query);

  // debounce the onSubmit handler, so it can make sure store is fully updated prior to submission
  const onSubmit = useDebouncedCallback(() => setQuery(store.getState().query), 50, {
    trailing: true,
    leading: false,
    maxWait: 1000,
  });

  const result = useSearch(query, {
    // we are allowing data to persist, but below the page will still show loading state
    // this is to keep stable data available for other hooks to use
    keepPreviousData: true,
    onSuccess(data) {
      // set docs on success
      setDocs(data.docs.map((d) => d.bibcode));

      // update store with the latest (working) query
      setLatestQuery(query);
    },
  });

  return { ...result, query, onSubmit };
};

const SearchPage: NextPage = () => {
  const store = useStoreApi();
  const updateQuery = useStore(updateQuerySelector);
  const { data, isSuccess, isError, isLoading, error, query, onSubmit } = useSearchQuery();

  useEffect(() => {
    // omit superfluous params
    const params = omit(['fl', 'start', 'rows'], query);

    // update router with changed params
    void router.push({ pathname: router.pathname, query: { ...router.query, ...params } }, null, {
      shallow: true,
    });

    // look at current query value, and if page is there update pagination to make sure it stays in sync with URL
    // if we're resetting the pagination anyway don't bother dispatching here
    if (typeof router.query.p === 'string' && query.start > 0) {
      pagination.dispatch({ type: 'SET_PAGE', payload: parseNumberAndClamp(router.query.p, 1) });
    }
  }, [query]);

  // re-calculates pagination when numFound, page or numPerPage changes
  const pagination = usePagination({ numFound: data?.numFound });

  // on pagination updates we want to attempt another search
  useEffect(() => {
    updateQuery({ start: pagination.startIndex, rows: pagination.numPerPage });
    onSubmit();
  }, [pagination.startIndex, pagination.numPerPage]);

  // on popstate change, trigger a new search (back button pressed)
  const router = useRouter();
  useEffect(() => {
    router.beforePopState(({ as }) => {
      try {
        const params = parseQueryFromUrl(qs.parse(as.split('?')?.[1]));
        updateQuery(omit(['p'], params));
        pagination.dispatch({ type: 'SET_PAGE', payload: params?.p });
        onSubmit();
      } catch (e) {
        // do nothing
      } finally {
        return true;
      }
    });

    return () => router.beforePopState(() => true);
  }, [router]);

  // on form submission, but not otherwise (probably need more granular control)
  // we should clear the selected docs.  We'll probably want to not do this ordinal changes like sort
  const clearSelectedDocs = useStore((state) => state.clearSelected);
  const handleOnSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { q } = store.getState().query;
    if (q && q.trim().length > 0) {
      pagination.dispatch({ type: 'RESET' });
      onSubmit();
      clearSelectedDocs();
    }
  };

  // trigger new search on sort change
  // should also reset pagination, but not clear docs
  const handleSortChange = (sort: SolrSort[]) => {
    updateQuery({ sort });
    pagination.dispatch({ type: 'RESET' });
    onSubmit();
  };

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
        </Flex>
        <Box mt={5}>{isSuccess && !isLoading && <ListActions onSortChange={handleSortChange} />}</Box>
      </form>
      <Box>
        <SearchErrorAlert error={error} show={isError} />
        {isLoading && <ItemsSkeleton count={pagination.numPerPage} />}
        {isSuccess && !isLoading && (
          <>
            <SimpleResultList docs={data.docs} indexStart={pagination.startIndex} />
            <Pagination totalResults={data.numFound} {...pagination} />
          </>
        )}
      </Box>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { fetchSearch } = await import('@_api/search');
  const { p: page, ...query } = parseQueryFromUrl<{ p: string }>(ctx.query);
  setupApiSSR(ctx);

  const params: IADSApiSearchParams = {
    ...defaultParams,
    ...query,
    q: query.q === '' ? '*:*' : query.q,
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
      queryKey: searchKeys.primary(cleanedParams),
      queryFn: fetchSearch,
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

const SearchErrorAlert = ({ error, show = false }: { error: unknown; show: boolean }) => {
  if (!show || !error) {
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
