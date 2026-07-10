import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getTocParams } from '@/api/search/models';
import { useGetToc } from '@/api/search/search';
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

const VolumePage: NextPage<AbsPageProps> = ({ ssr, queryId, initialDoc }) => {
  const router = useRouter();
  const id = router.query.id as string;

  const { doc, state } = useAbsRecordState({ ssr, queryId, initialDoc });

  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const { data, isSuccess, isLoading, isFetching, isError, error } = useGetToc(getParams(), {
    enabled: !!getParams && !!doc?.bibcode,
  });

  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const tocParams = doc?.bibcode ? getTocParams(doc.bibcode, 0, rows) : undefined;

  const handleMissingRecordFeedback = () => {
    void router.push({
      pathname: feedbackItems.record.path,
    });
  };

  return (
    <AbsRecordBoundary
      state={state}
      recordId={id}
      label="Volume Content"
      titleDescription="Papers in the same volume as"
      onFeedback={handleMissingRecordFeedback}
    >
      {(doc) => (
        <>
          {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
          {isError && <StandardAlertMessage title={parseAPIError(error)} />}
          {isEmpty && (
            <EmptyStatePanel
              title="No volume content"
              description="Table of contents is not available for this record."
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
              searchLinkParams={tocParams}
            />
          )}
        </>
      )}
    </AbsRecordBoundary>
  );
};

export default VolumePage;

export const getServerSideProps = createAbsGetServerSideProps('toc');
