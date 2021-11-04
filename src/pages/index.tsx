import { ISearchBarProps, SearchBar, SearchExamples } from '@components';
import { useSearchMachine } from '@machines';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import { NextPage } from 'next';
import { useCallback, useState } from 'react';

const HomePage: NextPage = () => {
  const { service: searchService } = useSearchMachine();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
  };

  return (
    <section aria-labelledby="form-title">
      <form
        method="get"
        action="/search"
        onSubmit={handleSubmit}
        className="grid gap-6 grid-cols-6 mx-auto my-8 px-4 py-8 lg:max-w-3xl"
      >
        <h2 className="sr-only" id="form-title">
          Modern Search Form
        </h2>
        <div className="col-span-6">
          <SearchBarWrapper searchService={searchService} isLoading={isLoading} />
        </div>
        <div className="col-span-6">
          <SearchExamplesWrapper searchService={searchService} />
        </div>
      </form>
    </section>
  );
};

const SearchExamplesWrapper = ({ searchService }: { searchService: ISearchMachine }) => {
  const query = useSelector(searchService, (state) => state.context.params.q);
  const handleExampleClick = useCallback(
    (text: string) => {
      searchService.send(TransitionType.SET_PARAMS, { payload: { params: { q: `${query} ${text}` } } });
    },
    [query],
  );
  return <SearchExamples onClick={handleExampleClick} />;
};

const SearchBarWrapper = (props: Omit<ISearchBarProps, 'query' | 'onChange'> & { searchService: ISearchMachine }) => {
  const { searchService, ...searchBarProps } = props;
  const query = useSelector(searchService, (state) => state.context.params.q);
  const setQuery = (query: string) => {
    searchService.send(TransitionType.SET_PARAMS, { payload: { params: { q: query } } });
  };
  return <SearchBar initialQuery={query} value={query} onQueryChange={setQuery} {...searchBarProps} />;
};

export default HomePage;
