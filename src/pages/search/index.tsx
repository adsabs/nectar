import AdsApi, { IADSApiBootstrapData, IDocsEntity, SolrSort } from '@api';
import { NumFound, ResultList, SearchBar, Sort } from '@components';
import {
  ChevronRightIcon,
  DownloadIcon,
  GlobeAltIcon,
  MinusCircleIcon,
  PencilIcon,
  PlusCircleIcon,
} from '@heroicons/react/solid';
import { rootInitialContext } from '@machines';
import { NectarPage } from '@types';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';
import { normalizeURLParams } from '../../utils';

interface ISearchPageProps extends NectarPage {
  error?: string;
  userData: IADSApiBootstrapData;
  params: {
    q: string;
    fl?: string[];
    sort?: SolrSort[];
  };
  docs: IDocsEntity[];
  meta: {
    numFound: number;
  };
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    params: { q: query, sort },
    docs = [],
    meta: { numFound = 0 },
  } = props;

  const form = React.useRef<HTMLFormElement>(null);
  console.log('params', { props });

  // const handleParamsChange = <P extends keyof IADSApiSearchParams>(param: P) => (value: IADSApiSearchParams[P]) => {
  //   console.log('set params', param, value);
  // };

  // const handleSubmit = () => {
  //   // service.send({ type: SearchMachineTransitionTypes['SEARCH'] });
  // };

  const handleSortChange = (updatedSort: SolrSort[]) => {
    console.log('submit', { sort, updatedSort });
    console.trace('submitting');
    if (sort && sort[0] !== updatedSort[0]) {
      form.current.submit();
    }
  };

  return (
    <section aria-labelledby="form-title">
      <form
        method="get"
        action="/search"
        ref={form}
        className="grid gap-2 grid-cols-6 mx-auto my-8 px-4 py-8 bg-white shadow sm:rounded-lg lg:max-w-7xl"
      >
        <h2 className="sr-only">Search Results</h2>
        <div className="col-span-6">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <SearchBar initialQuery={query} />
            </div>
            <Sort sort={sort ? sort[0] : undefined} onChange={handleSortChange} />
          </div>
          <NumFound count={numFound} />
          <Filters />
        </div>
        <div className="col-span-6">
          <ResultList docs={docs} />
        </div>
      </form>
    </section>

    // <form method="get" action="/search">
    //   <div className="lg:flex lg:items-center lg:justify-between">
    //     <div className="flex-1 min-w-0">
    //       <BreadCrumbs />
    //       <h2 className="mt-2 text-white text-2xl font-bold leading-7 sr-only sm:text-3xl sm:truncate">
    //         Search Results
    //       </h2>
    //       <div className="flex items-center space-x-5">
    //         <div className="flex-1">
    //           <SearchBar initialQuery={query} />
    //         </div>
    //         <div>
    //           <MenuButtons />
    //         </div>
    //       </div>
    //       <NumFound count={numFound} />
    // <div className="flex flex-col mt-1 sm:flex-row sm:flex-wrap sm:mt-1 sm:space-x-6">
    //   <div className="inline-flex items-center px-2 py-1 text-indigo-800 text-xs font-medium bg-indigo-100 rounded">
    //     <PlusCircleIcon className="mr-1.5 w-5 h-5 text-indigo-400" aria-hidden="true" />
    //     Collection: Astronomy
    //   </div>
    // </div>
    //       <div className="mt-1">
    //         <ResultList docs={docs} loading={false} />
    //       </div>
    //     </div>
    //   </div>
    // </form>
    // <form className="min-h-screen" onSubmit={handleSubmit} method="get" target="/search">
    //   <h2 className="sr-only">Results</h2>
    //   <div className="mt-6">
    //     <SearchBar initialQuery={query} />
    //     <NumFound count={numFound} />
    //   </div>
    //   <div className="flex my-3 space-x-2">
    //     <div className="p-3 bg-white border rounded-md">
    //       <Sort onChange={handleSubmit} sort={sort ? sort[0] : undefined} name="sort" />
    //     </div>
    //     <div className="flex-grow">
    //       <ResultList docs={docs} loading={false} />
    //     </div>
    //   </div>
    // </form>
  );
};

const Filters = () => (
  <div className="flex flex-col mt-1 sm:flex-row sm:flex-wrap sm:mt-1 sm:space-x-6">
    <div className="inline-flex items-center px-2 py-1 text-indigo-800 text-xs font-medium bg-indigo-100 rounded">
      <PlusCircleIcon className="mr-1.5 w-5 h-5 text-indigo-400" aria-hidden="true" />
      Collection: Astronomy
    </div>
    <div className="inline-flex items-center px-2 py-1 text-indigo-800 text-xs font-medium bg-indigo-100 rounded">
      <PlusCircleIcon className="mr-1.5 w-5 h-5 text-indigo-400" aria-hidden="true" />
      Collection: Physics
    </div>
    <div className="inline-flex items-center px-2 py-1 text-indigo-800 text-xs font-medium bg-indigo-100 rounded">
      <MinusCircleIcon className="mr-1.5 w-5 h-5 text-indigo-400" aria-hidden="true" />
      Author: Smith, S
    </div>
  </div>
);

const BreadCrumbs = () => (
  <nav className="flex" aria-label="Breadcrumb">
    <ol className="flex items-center space-x-4" role="list">
      <li>
        <div>
          <a href="#" className="hover:text-gray-300 text-gray-600 text-sm font-medium">
            Classic Search
          </a>
        </div>
      </li>
      <li>
        <div className="flex items-center">
          <ChevronRightIcon className="flex-shrink-0 w-5 h-5 text-gray-500" aria-hidden="true" />
          <a href="#" className="ml-4 hover:text-gray-300 text-gray-600 text-sm font-medium">
            Results
          </a>
        </div>
      </li>
    </ol>
  </nav>
);

const MenuButtons = () => (
  <div className="flex">
    <span className="hidden sm:block">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 text-white text-sm font-medium bg-gray-600 hover:bg-gray-700 border border-transparent rounded-md focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-gray-800 focus:ring-offset-2 focus:ring-2"
      >
        <PencilIcon className="-ml-1 mr-2 w-5 h-5 text-gray-300" aria-hidden="true" />
        Sort
      </button>
    </span>
    <span className="hidden ml-3 sm:block">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 text-white text-sm font-medium bg-gray-600 hover:bg-gray-700 border border-transparent rounded-md focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-gray-800 focus:ring-offset-2 focus:ring-2"
      >
        <DownloadIcon className="-ml-1 mr-2 w-5 h-5 text-gray-300" aria-hidden="true" />
        Export
      </button>
    </span>
    <span className="sm:ml-3">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 text-white text-sm font-medium bg-indigo-500 hover:bg-indigo-600 border border-transparent rounded-md focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-gray-800 focus:ring-offset-2 focus:ring-2"
      >
        <GlobeAltIcon className="-ml-1 mr-2 w-5 h-5" aria-hidden="true" />
        Explore
      </button>
    </span>
  </div>
);

export const getServerSideProps: GetServerSideProps<Omit<ISearchPageProps, 'service'>> = async (ctx) => {
  console.log('query', ctx.query);
  const query = normalizeURLParams(ctx.query);

  const request = ctx.req as typeof ctx.req & {
    session: { userData: IADSApiBootstrapData };
  };
  const userData = request.session.userData;
  const params = {
    q: query.q,
    fl: ['bibcode', 'title', 'author', '[fields author=3]', 'author_count', 'pubdate'],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);
  if (result.isErr()) {
    return {
      props: {
        error: result.error.message,
        userData: rootInitialContext.user,
        params: {
          q: '',
          fl: [],
          sort: [],
        },
        docs: [],
        meta: { numFound: 0 },
      },
    };
  }

  const { docs, numFound } = result.value;

  return {
    props: {
      userData,
      params,
      docs,
      meta: { numFound: numFound },
    },
  };
};

export default SearchPage;
