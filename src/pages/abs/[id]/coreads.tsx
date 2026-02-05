import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getCoreadsParams } from '@/api/search/models';
import { useGetAbstract, useGetCoreads } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';

const CoreadsPage: NextPage = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { data: abstractDoc } = useGetAbstract({ id });
  const doc = abstractDoc?.docs?.[0];

  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const { data, isSuccess, isLoading, isFetching, error, isError } = useGetCoreads({
    ...getParams(),
    start: pageIndex * rows,
  });

  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const coreadsParams = getCoreadsParams(doc?.bibcode, 0, rows);

  return (
    <AbsLayout doc={doc} titleDescription="Papers also read by those who read" label="Coreads">
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
    </AbsLayout>
  );
};

export default CoreadsPage;

export const getServerSideProps = createAbsGetServerSideProps('coreads');
