import { IADSApiSearchParams, SolrSort } from '@api';
import { Box, Flex } from '@chakra-ui/layout';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { VisuallyHidden } from '@chakra-ui/visually-hidden';
import { ItemsSkeleton, NumFound, SearchBar, SimpleResultList } from '@components';
import { Pagination } from '@components/ResultList/Pagination';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { AppState, useStore, useStoreApi } from '@store';
import { normalizeURLParams, parseNumberAndClamp } from '@utils';
import { searchKeys, useSearch } from '@_api/search';
import { defaultParams, getSearchStatsParams } from '@_api/search/models';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { omit } from 'ramda';
import { ChangeEvent, useEffect, useState } from 'react';
import { dehydrate, QueryClient } from 'react-query';

interface ISearchPageProps {
  searchParams: IADSApiSearchParams;
}

const useSearchQuery = (submitted: boolean, query: IADSApiSearchParams) => {
  const router = useRouter();
  const setLatestQuery = useStore((state) => state.setLatestQuery);

  const result = useSearch(query, {
    // we are allowing data to persist, but below the page will still show loading state
    // this is to keep stable data available for other hooks to use
    keepPreviousData: true,
    enabled: submitted,
    onSettled: () => {
      // omit superfluous params
      const params = omit(['fl', 'start', 'rows'], query);

      // update router with changed params
      router.push({ pathname: router.pathname, query: { ...router.query, ...params } }, null, {
        shallow: true,
      });

      // update store with the latest (working) query
      setLatestQuery(query);
    },
  });

  return result;
};

const SearchPage: NextPage<ISearchPageProps> = ({ searchParams }) => {
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
    updateAndSubmit({ ...omit(['p'], router.query) });
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
  const query = normalizeURLParams(ctx.query);
  const page = parseNumberAndClamp(query.p, 1, Number.MAX_SAFE_INTEGER);
  api.setToken(ctx.req.session.userData.access_token);

  const params: IADSApiSearchParams = {
    ...defaultParams,
    q: query.q ?? '*:*',
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : ['date desc'],
    start: (page - 1) * defaultParams.rows,
  };

  // omit fields from queryKey
  const { fl, ...cleanedParams } = params;
  const queryClient = new QueryClient();

  // primary query prefetch
  void (await queryClient.prefetchQuery({
    queryKey: searchKeys.primary(cleanedParams),
    queryFn: fetchSearch,
    meta: { params },
  }));

  // prefetch the citation counts for this query
  if (/^citation_count(_norm)?/.test(params.sort[0])) {
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.stats(cleanedParams),
      queryFn: fetchSearch,
      meta: { params: getSearchStatsParams(params, params.sort[0]) },
    }));
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      dehydratedAppState: {
        query: params,
        latestQuery: params,
      } as AppState,
      searchParams: params,
    },
  };
};

export default SearchPage;
