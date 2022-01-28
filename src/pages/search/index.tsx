import { IADSApiSearchParams, IADSApiSearchResponse, SolrSort } from '@api';
import { NumFound, SearchBar, SimpleResultList } from '@components';
import { Pagination } from '@components/ResultList/Pagination';
import { AppState, useStore, useStoreApi } from '@store';
import { normalizeURLParams } from '@utils';
import { searchKeys, useSearch } from '@_api/search';
import { defaultParams } from '@_api/search/models';
import { GetServerSideProps, NextPage } from 'next';
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
  const [submitted, setSubmitted] = useState(true);
  const updateQuery = useStore((state) => state.updateQuery);
  const setDocs = useStore((state) => state.setDocs);
  const params = useMemo(() => store.getState().query, [submitted]);

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
    onSuccess: (data: IADSApiSearchResponse['response']) => {
      // update the docs with the latest results
      setDocs(data.docs.map((d) => d.bibcode));
      updateUrl(params);
    },
  });

  // when submitted, shallowly update the route with the updated params (including page)
  useEffect(() => {
    if (submitted) {
      setSubmitted(false);
    }
  }, [submitted]);

  // on page change, update the current query and submit
  const handlePageChange = (currentPage: number, start: number) => {
    page.current = currentPage;
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
    <article aria-labelledby="search-form-title">
      <form
        method="get"
        action="/search"
        onSubmit={handleOnSubmit}
        className="grid gap-2 grid-cols-6 mx-auto my-8 px-4 py-8 bg-white shadow sm:rounded-lg lg:max-w-7xl"
      >
        <h2 className="sr-only" id="search-form-title">
          Search Results
        </h2>
        <div className="col-span-6">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <SearchBar isLoading={isFetching} />
            </div>
          </div>
          {!isFetching && <NumFound count={data?.numFound ?? 0} />}
        </div>
        <div className="col-span-6">
          {isSuccess && <SimpleResultList docs={data.docs} indexStart={params.start} />}
          {isSuccess && <Pagination totalResults={data.numFound} numPerPage={10} onPageChange={handlePageChange} />}
          {isError && (
            <div className="flex flex-col mt-1 p-3 border-2 border-red-600 space-y-1">
              <div className="flex items-center justify-center text-red-600 text-lg">{error}</div>
            </div>
          )}
        </div>
        <div className="col-span-6"></div>
      </form>
    </article>
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
  void (await queryClient.prefetchQuery({
    queryKey: searchKeys.primary(cleanedParams),
    queryFn: fetchSearch,
    meta: { params },
  }));

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      dehydratedAppState: { query: params } as AppState,
      searchParams: params,
    },
  };

  // const adsapi = new AdsApi({ token: ctx.req.session.userData.access_token });

  // let stats = 'false';
  // let stats_field = '';
  // if (query.sort) {
  //   const s = query.sort.split(',')[0].split(' ')[0];
  //   if (s === 'citation_count' || s === 'citation_count_norm') {
  //     stats = 'true';
  //     stats_field = s;
  //   }
  // }

  // const params: IADSApiSearchParams = {
  //   q: query.q,
  //   fl: [
  //     'bibcode',
  //     'title',
  //     'author',
  //     '[fields author=10]',
  //     'author_count',
  //     'pubdate',
  //     'bibstem',
  //     '[citations]',
  //     'citation_count',
  //     'citation_count_norm',
  //     'esources',
  //     'property',
  //     'data',
  //   ],
  //   sort: query.sort ? (query.sort.split(',') as SolrSort[]) : ['date desc'],
  //   rows: 10,
  //   start: (page - 1) * 10,
  //   stats: stats,
  //   'stats.field': stats_field,
  // };
  // const result = await adsapi.search.query(params);

  // const props = result.match(
  //   ({ response: { numFound, docs }, stats = null }) => ({
  //     params,
  //     docs,
  //     meta: { numFound, page },
  //     stats,
  //   }),
  //   ({ message }) => ({
  //     error: message,
  //     params: {
  //       q: '',
  //       fl: [],
  //       sort: [],
  //     },
  //     docs: [],
  //     meta: { numFound: 0, page },
  //     stats: null,
  //   }),
  // );
  // return { props };
};

export default SearchPage;
