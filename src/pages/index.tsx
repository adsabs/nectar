import { Box, Flex, Text } from '@chakra-ui/layout';
import { SearchBar, SearchExamples } from '@components';
import { useStore, useStoreApi } from '@store';
import { noop } from '@utils';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useEffect, useRef } from 'react';

const HomePage: NextPage = () => {
  const store = useStoreApi();
  const resetQuery = useStore((state) => state.resetQuery);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => resetQuery(), []);

  /**
   * update route and start searching
   */
  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const { q, sort } = store.getState().query;
    void router.push({ pathname: '/search', query: { q, sort } });
  };

  const handleExampleSelect = () => {
    // on example selection, move focus to input
    if (input.current && 'focus' in input.current) {
      input.current.focus();
    }
  };

  return (
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <Text as="h2" className="sr-only" id="form-title">
          Modern Search Form
        </Text>
        <Flex direction="column">
          <Box my={2}>
            <SearchBar ref={input} />
          </Box>
          <Box mb={2} mt={5}>
            <SearchExamplesWrapper onSelect={handleExampleSelect} />
          </Box>
        </Flex>
      </form>
    </Box>
  );
};

const SearchExamplesWrapper = ({ onSelect = noop }: { onSelect?: () => void }) => {
  const updateQuery = useStore((state) => state.updateQuery);
  const store = useStoreApi();
  const handleExampleClick = (text: string) => {
    const query = store.getState().query;

    // Add our text to the end of the query
    updateQuery({ q: `${query.q}${query.q.length > 0 ? ' ' : ''}${text}` });

    // fire select callback
    onSelect();
  };

  return <SearchExamples onClick={handleExampleClick} />;
};

export default HomePage;
