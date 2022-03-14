import { Box, Flex, Text } from '@chakra-ui/layout';
import { ISearchExamplesProps, SearchBar, SearchExamplesPlaceholder } from '@components';
import { useStore, useStoreApi } from '@store';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useEffect, useRef } from 'react';
import { useStore } from '@store';

const SearchExamples = dynamic<ISearchExamplesProps>(
  () => import('@components/SearchExamples').then((m) => m.SearchExamples),
  { ssr: false, loading: () => <SearchExamplesPlaceholder /> },
);

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
    void router.push({ pathname: '/search', query: { q, sort, p: 1 } });
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
            <SearchExamples onSelect={handleExampleSelect} />
          </Box>
        </Flex>
      </form>
    </Box>
  );
};

export default HomePage;
