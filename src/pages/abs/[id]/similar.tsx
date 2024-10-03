import { getSimilarParams, IDocsEntity, useGetAbstract, useGetSimilar } from '@/api';
import { AbstractRefList } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import { path } from 'ramda';
import { useRouter } from 'next/router';
import { APP_DEFAULTS } from '@/config';

const SimilarPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractResult } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractResult);
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);
  const { data, isSuccess } = useGetSimilar(
    { ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE },
    { keepPreviousData: true },
  );
  const similarParams = getSimilarParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers similar to" label="Similar Papers">
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={similarParams}
        />
      )}
    </AbsLayout>
  );
};

export default SimilarPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   try {
//     const { id } = ctx.params as { id: string };
//     const queryClient = new QueryClient();
//     await queryClient.prefetchQuery({
//       queryKey: searchKeys.similar({ bibcode: id, start: 0 }),
//       queryFn: fetchSearch,
//       meta: { params: getSimilarParams(id, 0) },
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
