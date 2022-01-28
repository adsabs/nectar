import { SearchBar, SearchExamples } from '@components';
import { useStore, useStoreApi } from '@store';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { ChangeEvent } from 'react';

const HomePage: NextPage = () => {
  const query = useStore((state) => state.query);
  const router = useRouter();

  /**
   * update route and start searching
   */
  const handleOnSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { q, sort } = query;
    void router.push({ pathname: '/search', query: { q, sort } });
  };

  return (
    <section aria-labelledby="form-title">
      <form
        method="get"
        action="/search"
        onSubmit={handleOnSubmit}
        className="grid gap-6 grid-cols-6 mx-auto my-8 px-4 py-8 lg:max-w-3xl"
      >
        <h2 className="sr-only" id="form-title">
          Modern Search Form
        </h2>
        <div className="col-span-6">
          <SearchBar />
        </div>
        <div className="col-span-6" suppressHydrationWarning>
          <SearchExamplesWrapper />
        </div>
      </form>
    </section>
  );
};

const SearchExamplesWrapper = () => {
  const updateQuery = useStore((state) => state.updateQuery);
  const store = useStoreApi();
  const handleExampleClick = (text: string) => {
    const query = store.getState().query;
    updateQuery({ q: `${query.q}${query.q.length > 0 ? ' ' : ''}${text}` });
  };

  return <SearchExamples onClick={handleExampleClick} />;
};

export default HomePage;
