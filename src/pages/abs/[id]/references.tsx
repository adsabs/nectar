import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getReferencesParams } from '@/api/search/models';
import { useGetAbstract, useGetReferences } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';

const ReferencesPage: NextPage = () => {
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
    isLoading,
    isFetching,
    error: referencesError,
  } = useGetReferences({
    ...getParams(),
    start: pageIndex * rows,
  });

  const hasError = abstractError || referencesError;
  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const referencesParams = getReferencesParams(doc?.bibcode, 0, rows);

  return (
    <AbsLayout doc={doc} titleDescription="Papers referenced by" label="References">
      {isLoading || isFetching ? <ItemsSkeleton count={10} /> : null}
      {hasError && <StandardAlertMessage title={parseAPIError(hasError)} />}
      {isEmpty && (
        <EmptyStatePanel
          title="No references listed"
          description="This paper does not have indexed references."
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
          searchLinkParams={referencesParams}
        />
      )}
    </AbsLayout>
  );
};

export default ReferencesPage;

export const getServerSideProps = createAbsGetServerSideProps('references');
