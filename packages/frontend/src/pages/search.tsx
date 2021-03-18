import api, { IDocsEntity } from '@nectar/api';
import { NumFound, ResultList, SearchBar } from '@nectar/components';
import { SearchMachine } from '@nectar/context';
import { useMachine } from '@xstate/react';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

interface ISearchPageProps {
  query: string;
  docs: IDocsEntity[];
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

  const [, send] = useMachine(SearchMachine);

  if (docs.length > 0) {
  }

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submit');
    send('FETCH');
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
      <div className="my-3">
        <ResultList docs={docs} />
      </div>
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
    const { docs, numFound } = await api.search.query({
      q: query,
      fl: ['bibcode', 'author', 'title', 'pubdate'],
    });

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
