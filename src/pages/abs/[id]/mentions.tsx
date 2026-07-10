import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getMentionsParams } from '@/api/search/models';
import { useGetMentions } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { feedbackItems } from '@/components/NavBar';
import { AbsRecordBoundary } from '@/components/AbsRecordBoundary';
import { AbsPageProps } from '@/lib/abs/absRecordState';
import { useAbsRecordState } from '@/lib/abs/useAbsRecordState';

const MentionsPage: NextPage<AbsPageProps> = ({ ssr, queryId, initialDoc }) => {
  const router = useRouter();
  const id = router.query.id as string;
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { doc, state } = useAbsRecordState({ ssr, queryId, initialDoc });

  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const {
    data,
    isSuccess,
    error: mentionsError,
    isLoading,
    isFetching,
  } = useGetMentions({
    ...getParams(),
    start: pageIndex * rows,
  });

  const hasError = mentionsError;
  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const mentionsParams = getMentionsParams(doc?.bibcode, 0, rows);

  const handleMissingRecordFeedback = () => {
    void router.push({
      pathname: feedbackItems.record.path,
    });
  };

  return (
    <AbsRecordBoundary
      state={state}
      recordId={id}
      label="Mentions"
      titleDescription="Papers mentioned by"
      onFeedback={handleMissingRecordFeedback}
    >
      {(doc) => (
        <>
          {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
          {hasError && <StandardAlertMessage title={parseAPIError(hasError)} />}
          {isEmpty && (
            <EmptyStatePanel
              title="No mentions found"
              description="Papers mentioned by this record will appear here."
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
              searchLinkParams={mentionsParams}
            />
          )}
        </>
      )}
    </AbsRecordBoundary>
  );
};

export default MentionsPage;

export const getServerSideProps = createAbsGetServerSideProps('mentions');
