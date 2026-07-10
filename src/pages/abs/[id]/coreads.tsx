import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCoreadsParams } from '@/api/search/models';
import { useGetCoreads } from '@/api/search/search';
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

const CoreadsPage: NextPage<AbsPageProps> = ({ ssr, queryId, initialDoc }) => {
  const router = useRouter();
  const id = router.query.id as string;
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { doc, state } = useAbsRecordState({ ssr, queryId, initialDoc });

  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const { data, isSuccess, isLoading, isFetching, error, isError } = useGetCoreads(
    {
      ...getParams(),
      start: pageIndex * rows,
    },
    { enabled: !!doc?.bibcode },
  );

  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const coreadsParams = getCoreadsParams(doc?.bibcode, 0, rows);

  const handleMissingRecordFeedback = () => {
    void router.push({
      pathname: feedbackItems.record.path,
    });
  };

  return (
    <AbsRecordBoundary
      state={state}
      recordId={id}
      label="Coreads"
      titleDescription="Papers also read by those who read"
      onFeedback={handleMissingRecordFeedback}
    >
      {(doc) => (
        <>
          {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
          {isError && <StandardAlertMessage title={parseAPIError(error)} />}
          {isEmpty && (
            <EmptyStatePanel
              title="No co-reads available"
              description="Co-reads show papers frequently read alongside this one. Requires read activity data."
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
              searchLinkParams={coreadsParams}
            />
          )}
        </>
      )}
    </AbsRecordBoundary>
  );
};

export default CoreadsPage;

export const getServerSideProps = createAbsGetServerSideProps('coreads');
