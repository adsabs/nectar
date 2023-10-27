import { Box, Flex, VisuallyHidden } from '@chakra-ui/react';
import { ISearchExamplesProps, SearchBar, SearchExamplesPlaceholder } from '@components';
import { useStore, useStoreApi } from '@store';
import { makeSearchParams } from '@utils';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { useIntermediateQuery } from '@lib/useIntermediateQuery';

const SearchExamples = dynamic<ISearchExamplesProps>(
  () => import('@components/SearchExamples').then((m) => m.SearchExamples),
  { ssr: false, loading: () => <SearchExamplesPlaceholder /> },
);

const HomePage: NextPage = () => {
  const store = useStoreApi();
  const submitQuery = useStore((state) => state.submitQuery);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { clearQuery, query } = useIntermediateQuery();

  // clear search on mount
  useEffect(() => clearQuery(), []);

  /**
   * update route and start searching
   */
  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const { sort } = store.getState().query;
    if (query && query.trim().length > 0) {
      setIsLoading(true);
      submitQuery();
      void router.push({ pathname: '/search', search: makeSearchParams({ q: query, sort, p: 1 }) });
    }
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
        <VisuallyHidden as="h2" id="form-title">
          Modern Search Form
        </VisuallyHidden>
        <Flex direction="column">
          <Box my={2}>
            <SearchBar ref={input} isLoading={isLoading} />
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
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
