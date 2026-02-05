import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getTocParams } from '@/api/search/models';
import { useGetAbstract, useGetToc } from '@/api/search/search';
import { AbstractRefList } from '@/components/AbstractRefList';
import { EmptyStatePanel, StandardAlertMessage } from '@/components/Feedbacks';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { parseAPIError } from '@/utils/common/parseAPIError';

const VolumePage: NextPage = () => {
  const router = useRouter();
  const id = router.query.id as string;

  const { data: abstractDoc } = useGetAbstract({ id });
  const doc = abstractDoc?.docs?.[0];

  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  const { data, isSuccess, isLoading, isFetching, isError, error } = useGetToc(getParams(), {
    enabled: !!getParams && !!doc?.bibcode,
  });

  const isEmpty = isSuccess && !isFetching && (!data?.docs || data.docs.length === 0);
  const tocParams = doc?.bibcode ? getTocParams(doc.bibcode, 0, rows) : undefined;

  return (
    <AbsLayout doc={doc} titleDescription="Papers in the same volume as" label="Volume Content">
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
    </AbsLayout>
  );
};

export default VolumePage;

export const getServerSideProps = createAbsGetServerSideProps('toc');
