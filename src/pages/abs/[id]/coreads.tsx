import { getCoreadsParams, useGetAbstract, useGetCoreads } from '@/api';
import { AbstractRefList } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { composeNextGSSP } from '@/ssr-utils';
import { withDetailsPage } from '@/hocs/withDetailsPage';
import { APP_DEFAULTS } from '@/config';

const CoreadsPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractDoc } = useGetAbstract({ id: router.query.id as string });
  const doc = abstractDoc?.docs?.[0];
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  const { data, isSuccess } = useGetCoreads(
    { ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE },
    { keepPreviousData: true },
  );
  const coreadsParams = getCoreadsParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers also read by those who read" label="Coreads">
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={coreadsParams}
        />
      )}
    </AbsLayout>
  );
};

export default CoreadsPage;

export const getServerSideProps = composeNextGSSP(withDetailsPage);
