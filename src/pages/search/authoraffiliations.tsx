import { ArrowLeftIcon } from '@chakra-ui/icons';
import { Button, Container as Box } from '@chakra-ui/react';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { NextPage } from 'next';
import { AuthorAffiliations, AuthorAffiliationsErrorMessage } from '@/components/AuthorAffiliations';
import { parseQueryFromUrl } from '@/utils/common/search';
import { useRouter } from 'next/router';
import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';
import { ErrorBoundary } from 'react-error-boundary';

const AuthorAffiliationsPage: NextPage = () => {
  const { handleBack } = useBackToSearchResults();
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
      <Button
        type="button"
        variant="link"
        size="sm"
        leftIcon={<ArrowLeftIcon />}
        mt="4"
        alignSelf="flex-start"
        onClick={handleBack}
      >
        Go back
      </Button>

      <Box as="section" maxW="container.xl" mt={0} mb="8" centerContent>
        <ErrorBoundary FallbackComponent={AuthorAffiliationsErrorMessage}>
          <AuthorAffiliations query={searchParams} w="full" maxW="container.lg" />
        </ErrorBoundary>
      </Box>
    </>
  );
};

export default AuthorAffiliationsPage;
