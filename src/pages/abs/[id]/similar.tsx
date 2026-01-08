import { NextPage } from 'next';
import { useRouter } from 'next/router';

import { path } from 'ramda';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { AbstractRefList } from '@/components/AbstractRefList';
import { useGetAbstract, useGetSimilar } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { getSimilarParams } from '@/api/search/models';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { NumPerPageType } from '@/types';

const SimilarPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractResult } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractResult);
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;
  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const { data, isSuccess, isLoading, isFetching, isError, error } = useGetSimilar({
    ...getParams(),
    start: pageIndex * rows,
  });

  const handlePageSizeChange = (n: NumPerPageType) => {
    onPageSizeChange(n);
  };

  const similarParams = getSimilarParams(doc?.bibcode, 0, rows);

  return (
    <AbsLayout doc={doc} titleDescription="Papers similar to" label="Similar Papers">
      {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
      {isError ? <StandardAlertMessage title={parseAPIError(error)} /> : null}
      {isSuccess ? (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          pageSize={rows}
          onPageSizeChange={handlePageSizeChange}
          searchLinkParams={similarParams}
        />
      ) : null}
    </AbsLayout>
  );
};

export default SimilarPage;

export const getServerSideProps = createAbsGetServerSideProps('similar');
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
