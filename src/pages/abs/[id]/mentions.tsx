import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getMentionsParams } from '@/api/search/models';
import { useGetAbstract, useGetMentions } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';

const MentionsPage: NextPage = () => {
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
    error: mentionsError,
    isLoading,
    isFetching,
  } = useGetMentions({
    ...getParams(),
    start: pageIndex * rows,
  });

  const hasError = abstractError || mentionsError;
  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const mentionsParams = getMentionsParams(doc?.bibcode, 0, rows);

  return (
    <AbsLayout doc={doc} titleDescription="Papers mentioned by" label="Mentions">
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
    </AbsLayout>
  );
};

export default MentionsPage;

export const getServerSideProps = createAbsGetServerSideProps('mentions');
