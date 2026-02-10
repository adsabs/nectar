import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCitationsParams } from '@/api/search/models';
import { useGetAbstract, useGetCitations } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { RecordNotFound } from '@/components/RecordNotFound';
import { feedbackItems } from '@/components/NavBar';

const CitationsPage: NextPage = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { data: abstractDoc, error: abstractError } = useGetAbstract({ id });
  const doc = abstractDoc?.docs?.[0];

  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const {
    data,
    isSuccess,
    error: citationsError,
    isLoading,
    isFetching,
  } = useGetCitations({
    ...getParams(),
    start: pageIndex * rows,
  });

  const hasError = abstractError || citationsError;
  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const citationsParams = getCitationsParams(doc?.bibcode, 0, rows);

  const handleMissingRecordFeedback = () => {
    void router.push({
      pathname: feedbackItems.record.path,
    });
  };

  return (
    <AbsLayout doc={doc} titleDescription="Papers that cite" label="Citations">
      {!doc ? (
        <RecordNotFound recordId={id || 'N/A'} onFeedback={handleMissingRecordFeedback} />
      ) : (
        <>
          {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
          {hasError && <StandardAlertMessage title={parseAPIError(hasError)} />}
          {isEmpty && (
            <EmptyStatePanel
              title="No citations yet"
              description="Papers that cite this work will appear here as they are indexed."
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
              searchLinkParams={citationsParams}
            />
          )}
        </>
      )}
    </AbsLayout>
  );
};

export default CitationsPage;

export const getServerSideProps = createAbsGetServerSideProps('citations');
