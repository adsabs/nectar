import api from '@nectar/api';
import { NumFound, SearchBar } from '@nectar/components';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';
import { useRootMachineContext } from '../context';

interface ISearchPageProps {
  query: string;
  docs: unknown[];
  meta: {
    numFound: number;
  };
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    query = '',
    docs = [],
    meta: { numFound = 0 },
  } = props;

  const [current] = useRootMachineContext();

  console.log(current.value, { docs });

  const handleSubmit = () => {
    console.log('submit');
  };

  return (
    <>
      <h2 className="sr-only">Results</h2>
      <form
        action="/search"
        method="get"
        className="mt-6"
        onSubmit={handleSubmit}
      >
        <SearchBar query={query} />
        <NumFound count={numFound} />
      </form>

      {/* <div className="mt-6">
        <Results docs={searchResult.docs} />
      </div> */}
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ISearchPageProps> = async (
  ctx,
) => {
  const query: string =
    typeof ctx.query.q === 'string'
      ? ctx.query.q
      : Array.isArray(ctx.query.q)
      ? ctx.query.q.join(' ')
      : '';

  try {
    const { docs, numFound } = await api.search.query({ q: query });

    return {
      props: {
        query,
        docs,
        meta: { numFound: numFound },
      },
    };
  } catch (e) {
    return {
      props: {
        query: '',
        docs: [],
        meta: { numFound: 0 },
      },
    };
  }
};

export default SearchPage;
