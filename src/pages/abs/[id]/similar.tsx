import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getSimilarParams } from '@/api/search/models';
import { useGetAbstract, useGetSimilar } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { feedbackItems } from '@/components/NavBar';
import { RecordNotFound } from '@/components/RecordNotFound';

const SimilarPage: NextPage = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { data: abstractDoc } = useGetAbstract({ id });
  const doc = abstractDoc?.docs?.[0];

  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const { data, isSuccess, isLoading, isFetching, isError, error } = useGetSimilar({
    ...getParams(),
    start: pageIndex * rows,
  });

  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const similarParams = getSimilarParams(doc?.bibcode, 0, rows);

  const handleMissingRecordFeedback = () => {
    void router.push({
      pathname: feedbackItems.record.path,
    });
  };

  return (
    <AbsLayout doc={doc} titleDescription="Papers similar to" label="Similar Papers">
      {!doc ? (
        <RecordNotFound recordId={id || 'N/A'} onFeedback={handleMissingRecordFeedback} />
      ) : (
        <>
          {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
          {isError && <StandardAlertMessage title={parseAPIError(error)} />}
          {isEmpty && (
            <EmptyStatePanel
              title="No similar papers found"
              description="Similar papers are identified from the abstract text."
              secondaryAction={{
                label: 'Back to Abstract',
                href: `/abs/${id}/abstract`,
              }}
            />
          )}
          {isSuccess && !isEmpty && (
            <AbstractRefList
              doc={doc}
              docs={data.docs}
              totalResults={data.numFound}
              onPageChange={onPageChange}
              pageSize={rows}
              onPageSizeChange={onPageSizeChange}
              searchLinkParams={similarParams}
            />
          )}
        </>
      )}
    </AbsLayout>
  );
};

export default SimilarPage;

export const getServerSideProps = createAbsGetServerSideProps('similar');
