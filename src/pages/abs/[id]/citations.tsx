import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { APP_DEFAULTS } from '@/config';
import { ItemsSkeleton } from '@/components/ResultList/ItemsSkeleton';
import { useGetAbstract, useGetCitations } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { getCitationsParams } from '@/api/search/models';

const CitationsPage: NextPage = () => {
  const router = useRouter();
  const {
    data: abstractDoc,
    error: abstractError,
    isLoading: absLoading,
    isFetching: absFetching,
  } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractDoc);
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;
  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  // get the primary response from server (or cache)
  const {
    data,
    isSuccess,
    error: citationsError,
    isLoading: citLoading,
    isFetching: citFetching,
  } = useGetCitations({ ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE }, { keepPreviousData: true });

  const isLoading = absLoading || absFetching || citLoading || citFetching;
  const citationsParams = getCitationsParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers that cite" label="Citations">
      {isLoading ? <ItemsSkeleton count={10} /> : null}
      {(abstractError || citationsError) && (
        <Alert status="error">
          <AlertIcon />
          {abstractError?.message || citationsError?.message}
        </Alert>
      )}
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={citationsParams}
        />
      )}
    </AbsLayout>
  );
};

export default CitationsPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   try {
//     const { id } = ctx.params as { id: string };
//     const queryClient = new QueryClient();
//     await queryClient.prefetchQuery({
//       queryKey: searchKeys.citations({ bibcode: id, start: 0 }),
//       queryFn: fetchSearch,
//       meta: { params: getCitationsParams(id, 0) },
//     });
//     return {
//       props: {
//         dehydratedState: dehydrate(queryClient),
//       },
//     };
//   } catch (err) {
//     logger.error({ err, url: ctx.resolvedUrl }, 'Error fetching details');
//     return {
//       props: {
//         pageError: parseAPIError(err),
//       },
//     };
//   }
// });
