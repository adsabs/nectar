import { getReferencesParams, IDocsEntity, useGetAbstract, useGetReferences } from '@/api';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { APP_DEFAULTS } from '@/config';

const ReferencesPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractDoc, error: abstractError } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractDoc);
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);
  const {
    data,
    isSuccess,
    error: referencesError,
  } = useGetReferences({ ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE }, { keepPreviousData: true });
  const referencesParams = getReferencesParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Paper referenced by" label="References">
      {(abstractError || referencesError) && (
        <Alert status="error">
          <AlertIcon />
          {abstractError?.message || referencesError?.message}
        </Alert>
      )}
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={referencesParams}
        />
      )}
    </AbsLayout>
  );
};

export default ReferencesPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   try {
//     const { id } = ctx.params as { id: string };
//     const queryClient = new QueryClient();
//     await queryClient.prefetchQuery({
//       queryKey: searchKeys.references({ bibcode: id, start: 0 }),
//       queryFn: fetchSearch,
//       meta: { params: getReferencesParams(id, 0) },
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
