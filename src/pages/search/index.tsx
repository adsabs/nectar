import { IADSApiSearchParams, IADSApiSearchResponse, SolrSort } from '@api';
import { Box, Flex } from '@chakra-ui/layout';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { VisuallyHidden } from '@chakra-ui/visually-hidden';
import { NumFound, SearchBar, SimpleResultList } from '@components';
import { Pagination } from '@components/ResultList/Pagination';
import { AppState, useStore, useStoreApi } from '@store';
import { normalizeURLParams } from '@utils';
import { searchKeys, useSearch } from '@_api/search';
import { defaultParams, getSearchStatsParams } from '@_api/search/models';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { dehydrate, QueryClient } from 'react-query';
interface ISearchPageProps {
  searchParams: IADSApiSearchParams;
}

const SearchPage: NextPage<ISearchPageProps> = ({ searchParams }) => {
  const router = useRouter();
  const store = useStoreApi();
  const page = useRef(1);

  /**
   * Flag to watch for when updating state.  Page (or start) is the one
   * param we want to ignore for param change when deciding to clear docs
   */
  const pageChangeFlag = useRef(false);
  const [submitted, setSubmitted] = useState(true);
  const updateQuery = useStore((state) => state.updateQuery);
  const setLatestQuery = useStore((state) => state.setLatestQuery);
  const setSelectedDocs = useStore((state) => state.setSelected);
  const setDocs = useStore((state) => state.setDocs);

  // memoize params (from state) to only update when we submit
  const params = useMemo(() => store.getState().query, [submitted]);

  const onResultsChange = (data: Partial<IADSApiSearchResponse['response']>) => {
    // update the docs with the latest results
    setDocs(data.docs.map((d) => d.bibcode));

    // update the url with the search params
    updateUrl(params);

    // save our latest successful query
    setLatestQuery(params);

    if (!pageChangeFlag.current) {
      // don't clear docs on a page change, only if the other props change
      setSelectedDocs([]);
    }
    pageChangeFlag.current = false;
  };

  const updateUrl = (params: IADSApiSearchParams) => {
    // omit fl, rows, and start from url
    const { fl, rows, start, ...cleanedParams } = params;
    void router.push({ pathname: '/search', query: { ...cleanedParams, p: page.current } }, null, {
      shallow: true,
    });
  };

  // update Url on param update
  useEffect(() => updateUrl(searchParams), [searchParams, page.current]);

  const { data, error, isSuccess, isError, isFetching } = useSearch(params, {
    keepPreviousData: true,
    enabled: submitted,
  });

  // call the onSuccess handler on all calls, rather than only on data fetches
  useEffect(() => {
    if (submitted && data) {
      onResultsChange(data);
    }
  }, [submitted, data]);

  // when submitted, shallowly update the route with the updated params (including page)
  useEffect(() => {
    if (submitted) {
      setSubmitted(false);
    }
  }, [submitted]);

  // on page change, update the current query and submit
  const handlePageChange = (currentPage: number, start: number) => {
    page.current = currentPage;
    pageChangeFlag.current = true;
    updateQuery({ start });
    setSubmitted(true);
  };

  /**
   * start searching
   */
  const handleOnSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Box aria-labelledby="search-form-title" my={16}>
      <Head>
        <title>NASA Science Explorer - Search Results</title>
      </Head>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <VisuallyHidden as="h2" id="search-form-title">
          Search Results
        </VisuallyHidden>
        <Flex direction="column" width="full">
          <SearchBar isLoading={isFetching} />
          {!isFetching && <NumFound count={data?.numFound ?? 0} />}
          {/* <Filters /> */}
        </Flex>
        <Box mt={5}>
          {isError && (
            <Alert status="error">
              <AlertIcon />
              {axios.isAxiosError(error) && error.message}
            </Alert>
          )}
          {isSuccess && <SimpleResultList docs={data.docs} indexStart={params.start} />}
          {isSuccess && <Pagination totalResults={data.numFound} numPerPage={10} onPageChange={handlePageChange} />}
        </Box>
      </form>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const api = (await import('@_api/api')).default;
  const { fetchSearch } = await import('@_api/search');
  const query = normalizeURLParams(ctx.query);
  const parsedPage = parseInt(query.p, 10);
  const page = isNaN(parsedPage) || Math.abs(parsedPage) > 500 ? 1 : Math.abs(parsedPage);
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
      dehydratedAppState: { query: params, latestQuery: params } as AppState,
      searchParams: params,
    },
  };
};

export default SearchPage;
