import { NumFound, SearchBar } from '@nectar/components';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

interface ISearchPageProps {
  query: string;
  meta: {
    numFound: number;
  };
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    query = '',
    meta: { numFound = 0 },
  } = props;

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
        <NumFound numFound={numFound} />
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
  return new Promise((resolve, reject) => {
    try {
      const query: string =
        typeof ctx.query.q === 'string'
          ? ctx.query.q
          : Array.isArray(ctx.query.q)
          ? ctx.query.q.join(' ')
          : '';

      return resolve({
        props: {
          query,
          meta: {
            numFound: 100,
          },
        },
      });
    } catch (e) {
      return reject({});
    }
  });
};

export default SearchPage;
