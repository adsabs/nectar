import search, { DocsEntity, SearchResult } from '@api/search';
import Button from '@components/base/button';
import SearchBar from '@components/searchbar';
import {
  faCaretRight,
  faChartLine,
  faFileExport,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryState } from '@recoil/atoms';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react';
import { MutableSnapshot, RecoilRoot, useRecoilValue } from 'recoil';

const NumFound = dynamic(() => import('@components/numfound'), { ssr: false });

const SearchPage: NextPage<SearchPageProps> = ({
  searchQuery,
  sort,
  searchResult,
}) => {
  const queryParams = useRecoilValue(queryState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('submit', queryParams);
  };

  const initializeState = ({ set }: MutableSnapshot) => {
    set(queryState, { q: searchQuery });
  };

  return (
    <RecoilRoot initializeState={initializeState}>
      <h2 className="sr-only">Results</h2>
      <form
        action="/search"
        method="get"
        className="mt-6"
        onSubmit={handleSubmit}
      >
        <SearchBar />
        <NumFound numFound={searchResult.numFound} />
      </form>

      <div className="mt-6">
        <Results docs={searchResult.docs} />
      </div>
    </RecoilRoot>
  );
  // const classes = useStyles();
  // // const [state, send] = useMachine(resultMachine);
  // // const { searchBarRef } = state.context;
  // const formProps = {
  //   action: '/search',
  //   method: 'get',
  //   onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
  //     console.log('submitting');
  //   },
  // };
  // return (
  //   <>
  //     <Head>{searchQuery && <title>{searchQuery}</title>}</Head>
  //     <RecoilRoot
  //       initializeState={({ set }) => {
  //         set(queryState, { q: searchQuery });
  //         set(resultState, searchResult);
  //       }}
  //     >
  //       <Grid container direction="column" component="form" {...formProps}>
  //         <Grid item className={classes.search} component="section">
  //           <SearchBar value={searchQuery} />
  //           <NumFound numFound={searchResult.numFound} />
  //         </Grid>
  //         <Grid item>
  //           <Results docs={searchResult.docs} />
  //         </Grid>
  //       </Grid>
  //     </RecoilRoot>
  //   </>
  // );
};

// const IsolatedSearchBar: React.FC<{ initialValue: string }> = ({
//   initialValue,
// }) => {
//   const [value, setValue] = React.useState('');
//   const handleClear = () => {
//     setValue('');
//   };
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setValue(e.currentTarget.value);
//   };

//   React.useEffect(() => setValue(initialValue), [initialValue]);

//   return (
//     <SearchBar value={value} onChange={handleChange} onClear={handleClear} />
//   );
// };

const Results: React.FC<{ docs: DocsEntity[] }> = ({ docs }) => {
  const facets = [
    'Authors',
    'Collections',
    'Refereed',
    'Institutions',
    'Keywords',
    'Publications',
    'Bib Groups',
    'SIMBAD Objects',
    'NED Objects',
    'Data',
    'Vizier Tables',
    'Publication Type',
  ];
  return (
    <div className="flex w-full md:flex-row flex-col">
      <div className="flex-1 md:mr-2">
        {docs.map((d, index) => (
          <Item key={d.id} doc={d} index={index + 1} />
        ))}
      </div>
      <div className="md:w-2/12">
        <div className="mb-1">
          <Button fullWidth>
            <FontAwesomeIcon icon={faFileExport} />
            <span className="ml-2">Export</span>
          </Button>
        </div>
        <div className="mb-1">
          <Button fullWidth>
            <FontAwesomeIcon icon={faChartLine} />
            <span className="ml-2">Export</span>
          </Button>
        </div>
        <div className="border border-gray-300 rounded-md p-2 ">
          {facets.map((f) => (
            <div key={f}>
              <button>
                <FontAwesomeIcon icon={faCaretRight} />
                <span className="ml-2">{f}</span>
              </button>
            </div>
          ))}
        </div>
        <div className="border border-gray-300 rounded-md p-2 ">graphs</div>
      </div>
    </div>
  );
};

const Item: React.FC<{ doc: DocsEntity; index: number }> = ({ doc, index }) => {
  return (
    <div className="flex border mb-4 p-1 rounded-lg mx-1 md:mx-0">
      <div className="hidden md:flex items-center justify-center mr-3">
        {index}
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex justify-between">
          <Link href={`/abs/${doc.bibcode}`}>
            <a className="text-xs hover:underline">{doc.bibcode}</a>
          </Link>
          <div className="text-xs">{doc.pubdate}</div>
        </div>
        <Link href={`/abs/${doc.bibcode}`}>
          <a className="text-blue-700 text-lg hover:underline">
            <h3>{doc.title}</h3>
          </a>
        </Link>
        <div className="text-xs">{doc.author.slice(0, 3).join('; ')}</div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (
  ctx: GetServerSidePropsContext
) => {
  try {
    const {
      response: { numFound, docs },
      responseHeader: {
        params: { q, sort },
      },
    } = await search({ ctx });

    return {
      props: {
        searchQuery: q,
        sort,
        searchResult: {
          numFound,
          docs,
        },
      },
    };
  } catch (e) {
    return {
      props: {
        searchQuery: '',
        sort: '',
        searchResult: {
          numFound: 0,
          docs: [],
        },
      },
    };
  }
};

interface SearchPageProps {
  searchQuery: string;
  sort: string;
  searchResult: Omit<SearchResult, 'start'>;
}

export default SearchPage;
