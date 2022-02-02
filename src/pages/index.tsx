import { Box, Flex, Text } from '@chakra-ui/layout';
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
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleSubmit}>
        <Text as="h2" className="sr-only" id="form-title">
          Modern Search Form
        </Text>
        <Flex direction="column">
          <Box my={2}>
            <SearchBarWrapper searchService={searchService} isLoading={isLoading} />
          </Box>
          <Box mb={2} mt={5}>
            <SearchExamplesWrapper searchService={searchService} />
          </Box>
        </Flex>
      </form>
    </Box>
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
  return <SearchBar initialQuery={query} onQueryChange={setQuery} {...searchBarProps} />;
};

export default HomePage;
