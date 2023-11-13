import { Box, Flex, VisuallyHidden } from '@chakra-ui/react';
import { ISearchExamplesProps, SearchBar, SearchExamplesPlaceholder } from '@components';
import { useStore, useStoreApi } from '@store';
import { makeSearchParams } from '@utils';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';
import { useIntermediateQuery } from '@lib/useIntermediateQuery';

const SearchExamples = dynamic<ISearchExamplesProps>(
  () => import('@components/SearchExamples').then((m) => m.SearchExamples),
  { ssr: false, loading: () => <SearchExamplesPlaceholder /> },
);

const HomePage: NextPage = () => {
  const store = useStoreApi();
  const submitQuery = useStore((state) => state.submitQuery);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { clearQuery, updateQuery } = useIntermediateQuery();

  // clear search on mount
  useEffect(() => clearQuery(), []);

  /**
   * update route and start searching
   */
  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const { sort } = store.getState().query;
      const query = new FormData(e.currentTarget).get('q') as string;

      if (query && query.trim().length > 0) {
        updateQuery(query);
        setIsLoading(true);
        submitQuery();
        void router.push({ pathname: '/search', search: makeSearchParams({ q: query, sort, p: 1 }) });
      }
    },
    [router, store, submitQuery, updateQuery],
  );

  return (
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <VisuallyHidden as="h2" id="form-title">
          Modern Search Form
        </VisuallyHidden>
        <Flex direction="column">
          <Box my={2}>
            <SearchBar isLoading={isLoading} />
          </Box>
          <Box mb={2} mt={5}>
            <SearchExamples />
          </Box>
        </Flex>
      </form>
    </Box>
  );
};

export default HomePage;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
