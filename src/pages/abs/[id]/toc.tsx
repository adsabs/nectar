import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { ItemsSkeleton } from '@/components/ResultList/ItemsSkeleton';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { useGetAbstract, useGetToc } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { getTocParams } from '@/api/search/models';

const VolumePage: NextPage = () => {
  const router = useRouter();
  const { data: abstractResult } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractResult);

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  const { data, isSuccess, isLoading, isFetching, isError, error } = useGetToc(getParams(), {
    enabled: !!getParams && !!doc?.bibcode,
    keepPreviousData: true,
  });

  const tocParams = useMemo(() => {
    if (doc?.bibcode) {
      return getTocParams(doc.bibcode, 0);
    }
  }, [doc]);

  return (
    <AbsLayout doc={doc} titleDescription="Papers in the same volume as" label="Volume Content">
      {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
      {isError ? <StandardAlertMessage title={parseAPIError(error)} /> : null}
      {isSuccess ? (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={tocParams}
        />
      ) : null}
    </AbsLayout>
  );
};

export default VolumePage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   try {
//     const { id } = ctx.params as { id: string };
//     const queryClient = new QueryClient();
//     await queryClient.prefetchQuery({
//       queryKey: searchKeys.toc({ bibcode: id, start: 0 }),
//       queryFn: fetchSearch,
//       meta: { params: getTocParams(id, 0) },
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
