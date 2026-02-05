import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCreditsParams } from '@/api/search/models';
import { useGetAbstract, useGetCredits } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';

const CreditsPage: NextPage = () => {
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
    error: creditsError,
    isLoading,
    isFetching,
  } = useGetCredits({
    ...getParams(),
    start: pageIndex * rows,
  });

  const hasError = abstractError || creditsError;
  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const creditsParams = getCreditsParams(doc?.bibcode, 0, rows);

  return (
    <AbsLayout doc={doc} titleDescription="Papers that credited" label="Credits">
      {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
      {hasError && <StandardAlertMessage title={parseAPIError(hasError)} />}
      {isEmpty && (
        <EmptyStatePanel
          title="No credits found"
          description="Papers that credit this record will appear here."
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
          searchLinkParams={creditsParams}
        />
      )}
    </AbsLayout>
  );
};

export default CreditsPage;

export const getServerSideProps = createAbsGetServerSideProps('credits');
