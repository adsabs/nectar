import { Box, Flex, Text } from '@chakra-ui/layout';
import { SearchBar, SearchExamples } from '@components';
import { useStore, useStoreApi } from '@store';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { ChangeEventHandler } from 'react';

const HomePage: NextPage = () => {
  const query = useStore((state) => state.query);
  const router = useRouter();

  /**
   * update route and start searching
   */
  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const { q, sort } = query;
    void router.push({ pathname: '/search', query: { q, sort } });
  };

  return (
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <Text as="h2" className="sr-only" id="form-title">
          Modern Search Form
        </Text>
        <Flex direction="column">
          <Box my={2}>
            <SearchBar />
          </Box>
          <Box mb={2} mt={5}>
            <SearchExamplesWrapper />
          </Box>
        </Flex>
      </form>
    </Box>
  );
};

const SearchExamplesWrapper = () => {
  const updateQuery = useStore((state) => state.updateQuery);
  const store = useStoreApi();
  const handleExampleClick = (text: string) => {
    const query = store.getState().query;

    // Add our text to the end of the query
    updateQuery({ q: `${query.q}${query.q.length > 0 ? ' ' : ''}${text}` });
  };

  return <SearchExamples onClick={handleExampleClick} />;
};

export default HomePage;
