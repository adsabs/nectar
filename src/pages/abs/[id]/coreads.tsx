import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { APP_DEFAULTS } from '@/config';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { AbstractRefList } from '@/components/AbstractRefList';
import { useGetAbstract, useGetCoreads } from '@/api/search/search';
import { getCoreadsParams } from '@/api/search/models';

const CoreadsPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractDoc } = useGetAbstract({ id: router.query.id as string });
  const doc = abstractDoc?.docs?.[0];
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  const { data, isSuccess, isLoading, isFetching, error, isError } = useGetCoreads(
    { ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE },
    { keepPreviousData: true },
  );
  const coreadsParams = getCoreadsParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers also read by those who read" label="Coreads">
      {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
      {isError ? <StandardAlertMessage title={parseAPIError(error)} /> : null}
      {isSuccess ? (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={coreadsParams}
        />
      ) : null}
    </AbsLayout>
  );
};

export default CoreadsPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   try {
//     const { id } = ctx.params as { id: string };
//     const queryClient = new QueryClient();
//     await queryClient.prefetchQuery({
//       queryKey: searchKeys.coreads({ bibcode: id, start: 0 }),
//       queryFn: fetchSearch,
//       meta: { params: getCoreadsParams(id, 0) },
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
