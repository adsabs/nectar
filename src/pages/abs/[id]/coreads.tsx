import { getCoreadsParams, useGetAbstract, useGetCoreads } from '@/api';
import { AbstractRefList } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { APP_DEFAULTS } from '@/config';

const CoreadsPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractDoc } = useGetAbstract({ id: router.query.id as string });
  const doc = abstractDoc?.docs?.[0];
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  const { data, isSuccess } = useGetCoreads(
    { ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE },
    { keepPreviousData: true },
  );
  const coreadsParams = getCoreadsParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers also read by those who read" label="Coreads">
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={coreadsParams}
        />
      )}
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
