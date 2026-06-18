import { Container as Box } from '@chakra-ui/react';
import { BackToSearchResults } from '@/components/BackToSearchResults';
import { NextPage } from 'next';
import { AuthorAffiliations, AuthorAffiliationsErrorMessage } from '@/components/AuthorAffiliations';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import { useRouter } from 'next/router';
import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';
import { ErrorBoundary } from 'react-error-boundary';

const AuthorAffiliationsPage: NextPage = () => {
  const router = useRouter();
  const { qid, ...query } = parseQueryFromUrl<{ qid: string; format: string }>(router.asPath, {
    sortPostfix: 'id asc',
  });
  const searchParams: IADSApiSearchParams = {
    rows: APP_DEFAULTS.AUTHOR_AFF_SEARCH_SIZE,
    fl: ['bibcode'],
    sort: APP_DEFAULTS.SORT,
    ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
  };

  return (
    <>
      <BackToSearchResults
        reconstructed={qid ? null : `/search?${makeSearchParams(query)}`}
        buttonProps={{ mt: '4' }}
      />

      <Box as="section" maxW="container.xl" mt={0} mb="8" centerContent>
        <ErrorBoundary FallbackComponent={AuthorAffiliationsErrorMessage}>
          <AuthorAffiliations query={searchParams} w="full" maxW="container.lg" />
        </ErrorBoundary>
      </Box>
    </>
  );
};

export default AuthorAffiliationsPage;
