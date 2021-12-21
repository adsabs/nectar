import AdsApi, { IADSApiSearchParams, IDocsEntity, SolrSort } from '@api';
import { ISearchStatsFields } from '@api/lib/search/types';
import { Box, Flex } from '@chakra-ui/layout';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { VisuallyHidden } from '@chakra-ui/visually-hidden';
import { ISearchBarProps, NumFound, ResultList, SearchBar } from '@components';
import { useSearchMachine } from '@machines';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { normalizeURLParams } from '@utils';
import { useSelector } from '@xstate/react';
import { GetServerSideProps, NextPage } from 'next';
import { ChangeEvent, ReactElement } from 'react';
interface ISearchPageProps {
  error?: string;
  params: {
    q: string;
    fl?: string[];
    sort?: SolrSort[];
  };
  docs: IDocsEntity[];
  meta: {
    numFound: number;
    page: number;
  };
  stats?: ISearchStatsFields;
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    params: { q, sort = ['date desc'] },
    docs = [],
    meta: { numFound = 0, page },
    stats,
    error,
  } = props;

  return <Form params={{ q, sort }} serverResult={{ docs, numFound, page, stats }} serverError={error} />;
};

interface IFormProps {
  params: IADSApiSearchParams;
  serverResult: {
    docs: IDocsEntity[];
    numFound: number;
    page: number;
    stats: ISearchStatsFields;
  };
  serverError: string;
}
const Form = (props: IFormProps): ReactElement => {
  const {
    params: { q: query, sort },
    serverResult: { docs, numFound, page, stats },
    serverError,
  } = props;

  // initialize the search machine that will run all the business logic
  const {
    service: searchService,
    result,
    error,
    isLoading,
    isFailure,
  } = useSearchMachine({
    initialParams: { q: query, sort },
    initialResult: { docs, numFound, stats },
    initialPagination: { numPerPage: 10, page },
  });

  /**
   * update route and start searching
   */
  const handleOnSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    searchService.send(TransitionType.SEARCH);
  };

  return (
    <Box aria-labelledby="search-form-title" my={16}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <VisuallyHidden as="h2" id="search-form-title">
          Search Results
        </VisuallyHidden>
        <Flex direction="column" width="full">
          <SearchBarWrapper searchService={searchService} />
          <NumFound searchService={searchService} count={result.numFound} />
          {/* <Filters /> */}
        </Flex>
        <Box mt={5}>
          {isFailure || typeof serverError === 'string' ? (
            <Alert status="error">
              <AlertIcon />
              {error.message || serverError}
            </Alert>
          ) : (
            <ResultList
              isLoading={isLoading}
              docs={result.docs as IDocsEntity[]}
              service={searchService}
              showActions={true}
            />
          )}
        </Box>
      </form>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps<ISearchPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const parsedPage = parseInt(query.p, 10);
  const page = isNaN(parsedPage) || Math.abs(parsedPage) > 500 ? 1 : Math.abs(parsedPage);
  const adsapi = new AdsApi({ token: ctx.req.session.userData.access_token });

  let stats = 'false';
  let stats_field = '';
  if (query.sort) {
    const s = query.sort.split(',')[0].split(' ')[0];
    if (s === 'citation_count' || s === 'citation_count_norm') {
      stats = 'true';
      stats_field = s;
    }
  }

  const params: IADSApiSearchParams = {
    q: query.q,
    fl: [
      'bibcode',
      'title',
      'author',
      '[fields author=10]',
      'author_count',
      'pubdate',
      'bibstem',
      '[citations]',
      'citation_count',
      'citation_count_norm',
      'esources',
      'property',
      'data',
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : ['date desc'],
    rows: 10,
    start: (page - 1) * 10,
    stats: stats,
    'stats.field': stats_field,
  };
  const result = await adsapi.search.query(params);

  const props = result.match(
    ({ response: { numFound, docs }, stats = null }) => ({
      params,
      docs,
      meta: { numFound, page },
      stats,
    }),
    ({ message }) => ({
      error: message,
      params: {
        q: '',
        fl: [],
        sort: [],
      },
      docs: [],
      meta: { numFound: 0, page },
      stats: null,
    }),
  );
  return { props };
};

export default SearchPage;

const SearchBarWrapper = (props: Omit<ISearchBarProps, 'query' | 'onChange'> & { searchService: ISearchMachine }) => {
  const { searchService, ...searchBarProps } = props;
  const query = useSelector(searchService, (state) => state.context.params.q);
  const isLoading = useSelector(searchService, (state) => state.matches('fetching'));

  const setQuery = (query: string) => {
    searchService.send(TransitionType.SET_PARAMS, { payload: { params: { q: query } } });
  };
  return <SearchBar initialQuery={query} onQueryChange={setQuery} isLoading={isLoading} {...searchBarProps} />;
};

// const Filters = () => (
//   <div className="flex flex-col mt-1 sm:flex-row sm:flex-wrap sm:mt-1 sm:space-x-6">
//     <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-800 bg-indigo-100 rounded">
//       <PlusCircleIcon className="mr-1.5 w-5 h-5 text-indigo-400" aria-hidden="true" />
//       Collection: Astronomy
//     </div>
//     <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-800 bg-indigo-100 rounded">
//       <PlusCircleIcon className="mr-1.5 w-5 h-5 text-indigo-400" aria-hidden="true" />
//       Collection: Physics
//     </div>
//     <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-800 bg-indigo-100 rounded">
//       <MinusCircleIcon className="mr-1.5 w-5 h-5 text-indigo-400" aria-hidden="true" />
//       Author: Smith, S
//     </div>
//   </div>
// );

// const BreadCrumbs = () => (
//   <nav className="flex" aria-label="Breadcrumb">
//     <ol className="flex items-center space-x-4" role="list">
//       <li>
//         <div>
//           <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-300">
//             Classic Search
//           </a>
//         </div>
//       </li>
//       <li>
//         <div className="flex items-center">
//           <ChevronRightIcon className="flex-shrink-0 w-5 h-5 text-gray-500" aria-hidden="true" />
//           <a href="#" className="ml-4 text-sm font-medium text-gray-600 hover:text-gray-300">
//             Results
//           </a>
//         </div>
//       </li>
//     </ol>
//   </nav>
// );

// const MenuButtons = () => (
//   <div className="flex">
//     <span className="hidden sm:block">
//       <button
//         type="button"
//         className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:ring-offset-gray-800 focus:ring-offset-2 focus:ring-2"
//       >
//         <PencilIcon className="w-5 h-5 mr-2 -ml-1 text-gray-300" aria-hidden="true" />
//         Sort
//       </button>
//     </span>
//     <span className="hidden ml-3 sm:block">
//       <button
//         type="button"
//         className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:ring-offset-gray-800 focus:ring-offset-2 focus:ring-2"
//       >
//         <DownloadIcon className="w-5 h-5 mr-2 -ml-1 text-gray-300" aria-hidden="true" />
//         Export
//       </button>
//     </span>
//     <span className="sm:ml-3">
//       <button
//         type="button"
//         className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-indigo-500 focus:ring-offset-gray-800 focus:ring-offset-2 focus:ring-2"
//       >
//         <GlobeAltIcon className="w-5 h-5 mr-2 -ml-1" aria-hidden="true" />
//         Explore
//       </button>
//     </span>
//   </div>
// );
