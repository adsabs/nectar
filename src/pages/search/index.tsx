import AdsApi, { IADSApiSearchParams, IDocsEntity, SolrSort } from '@api';
import { NumFound, ResultList, SearchBar, Sort } from '@components';
import { INectarPageProps, withNectarPage } from '@hocs/withNectarPage';
import { useSearchMachine } from '@machines';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { normalizeURLParams, withNectarSessionData } from '@utils';
import { useSelector } from '@xstate/react';
import React, { ChangeEvent, useCallback } from 'react';

interface ISearchPageProps extends INectarPageProps {
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
}

const SearchPage = withNectarPage<ISearchPageProps>((props) => {
  const {
    params: { q, sort = ['date desc'] },
    docs = [],
    meta: { numFound = 0, page },
    error,
  } = props;

  console.log('search page props', props);

  return <Form params={{ q, sort }} serverResult={{ docs, numFound, page }} serverError={error} />;
});

interface IFormProps {
  params: IADSApiSearchParams;
  serverResult: {
    docs: IDocsEntity[];
    numFound: number;
    page: number;
  };
  serverError: string;
}
const Form = (props: IFormProps): React.ReactElement => {
  const {
    params: { q: query, sort },
    serverResult: { docs, numFound, page },
    serverError,
  } = props;

  // initialize the search machine that will run all the business logic
  const { service: searchService, result, error, isLoading, isFailure } = useSearchMachine({
    initialParams: { q: query, sort },
    initialResult: { docs, numFound },
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
    <section aria-labelledby="form-title">
      <form
        method="get"
        action="/search"
        onSubmit={handleOnSubmit}
        className="grid grid-cols-6 gap-2 px-4 py-8 mx-auto my-8 bg-white shadow sm:rounded-lg lg:max-w-7xl"
      >
        <h2 className="sr-only" id="form-title">
          Search Results
        </h2>
        <div className="col-span-6">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <SearchBar service={searchService} />
            </div>
            <SortWrapper service={searchService} />
          </div>
          <NumFound count={result.numFound} />
          {/* <Filters /> */}
        </div>
        <div className="col-span-6">
          {isFailure || typeof serverError === 'string' ? (
            <div className="flex flex-col p-3 mt-1 space-y-1 border-2 border-red-600">
              <div className="flex items-center justify-center text-lg text-red-600">
                {error.message || serverError}
              </div>
            </div>
          ) : (
            <ResultList isLoading={isLoading} docs={result.docs as IDocsEntity[]} service={searchService} />
          )}
        </div>
        <div className="col-span-6"></div>
      </form>
    </section>
  );
};

/**
 * Wraps the <Sort/> component in order to isolate renders
 */
const SortWrapper = ({ service: searchService }: { service: ISearchMachine }) => {
  const handleSortChange = useCallback((newSort: SolrSort[]) => {
    searchService.send({ type: TransitionType.SET_PARAMS, payload: { params: { sort: newSort } } });
  }, []);

  const sort = useSelector(searchService, (state) => state.context.params.sort);

  return <Sort sort={sort} onChange={handleSortChange} />;
};

export const getServerSideProps = withNectarSessionData<ISearchPageProps>(async (ctx, sessionData) => {
  const query = normalizeURLParams(ctx.query);
  const parsedPage = parseInt(query.p);
  const page = isNaN(parsedPage) ? 1 : Math.abs(parsedPage);

  console.log('page', page, (page - 1) * 10);

  const params: IADSApiSearchParams = {
    q: query.q,
    fl: ['bibcode', 'title', 'author', '[fields author=3]', 'author_count', 'pubdate'],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : ['date desc'],
    rows: 10,
    start: (page - 1) * 10,
  };

  console.log('search params', params);
  const adsapi = new AdsApi({ token: sessionData.access_token });
  const result = await adsapi.search.query(params);
  if (result.isErr()) {
    console.log('is Error', result.error.message);
    return {
      props: {
        error: result.error.message,
        sessionData,
        params: {
          q: '',
          fl: [],
          sort: [],
        },
        docs: [],
        meta: { numFound: 0, page },
      },
    };
  }

  const { docs, numFound } = result.value;

  console.log(
    'result',
    docs.map((d) => d.bibcode),
  );

  return {
    props: {
      sessionData,
      params,
      docs,
      meta: { numFound, page },
    },
  };
});

export default SearchPage;

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
