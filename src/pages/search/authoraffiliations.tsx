import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Button, Container as Box } from '@chakra-ui/react';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { NextPage } from 'next';
import { logger } from '@/logger';
import { AuthorAffiliations, AuthorAffiliationsErrorMessage } from '@/components/AuthorAffiliations';
import { SimpleLink } from '@/components/SimpleLink';
import { parseQueryFromUrl } from '@/utils/common/search';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { useRouter } from 'next/router';
import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';
import { ErrorBoundary } from 'react-error-boundary';

const AuthorAffiliationsPage: NextPage = () => {
  const { getSearchHref, show: showBackLink } = useBackToSearchResults();
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
      {showBackLink && (
        <Button as={SimpleLink} href={getSearchHref()} variant={'outline'} leftIcon={<ChevronLeftIcon />} mt="4">
          Back to Results
        </Button>
      )}

      <Box as="section" maxW="container.xl" mt={showBackLink ? 0 : 4} mb="8" centerContent>
        <ErrorBoundary FallbackComponent={AuthorAffiliationsErrorMessage}>
          <AuthorAffiliations query={searchParams} w="full" maxW="container.lg" />
        </ErrorBoundary>
      </Box>
    </>
  );
};

export default AuthorAffiliationsPage;

// export const getServerSideProps = composeNextGSSP(async (ctx) => {
//   const {
//     qid = null,
//     p,
//     format,
//     ...query
//   } = parseQueryFromUrl<{ qid: string; format: string }>(ctx.req.url, { sortPostfix: 'id asc' });
//
//   if (!query && !qid) {
//     return {
//       props: {
//         error: 'No Records',
//       },
//     };
//   }
//
//   const queryClient = new QueryClient();
//   const params: IADSApiSearchParams = {
//     rows: APP_DEFAULTS.AUTHOR_AFF_SEARCH_SIZE,
//     fl: ['bibcode'],
//     sort: APP_DEFAULTS.SORT,
//     ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
//   };
//
//   try {
//     // primary search, this is based on query params
//     const data = await queryClient.fetchInfiniteQuery({
//       queryKey: searchKeys.infinite(params),
//       queryFn: fetchSearchInfinite,
//       meta: { params },
//     });
//
//     const authorAffiliationParams = getAuthorAffiliationSearchParams({
//       bibcode: data.pages[0].response.docs.map((d) => d.bibcode),
//     });
//
//     try {
//       void (await queryClient.fetchQuery({
//         queryKey: authorAffiliationsKeys.search(authorAffiliationParams),
//         queryFn: fetchAuthorAffiliationSearch,
//         meta: { params: authorAffiliationParams },
//       }));
//
//       // react-query infinite queries cannot be serialized by next, currently.
//       // see https://github.com/tannerlinsley/react-query/issues/3301#issuecomment-1041374043
//
//       const dehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));
//
//       return {
//         props: {
//           params: authorAffiliationParams,
//           query: params,
//           dehydratedState,
//         },
//       };
//     } catch (error) {
//       logger.error({ msg: 'GSSP error on author affiliations form', error });
//       return {
//         props: {
//           params: authorAffiliationParams,
//           query: params,
//           error: parseAPIError(error),
//         },
//       };
//     }
//   } catch (e) {
//     logger.error({ msg: 'GSSP error on search for author affiliations form', error: e });
//     return {
//       props: {
//         query: params,
//         error: parseAPIError(e),
//       },
//     };
//   }
// });
