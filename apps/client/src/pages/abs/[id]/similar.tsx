import { getSimilarParams, IDocsEntity, useGetAbstract, useGetSimilar } from '@/api';
import { AbstractRefList } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { withDetailsPage } from '@/hocs/withDetailsPage';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { GetServerSideProps, NextPage } from 'next';
import { composeNextGSSP } from '@/ssr-utils';
import { path } from 'ramda';
import { useRouter } from 'next/router';
import { APP_DEFAULTS } from '@/config';

const SimilarPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractResult } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractResult);
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);
  const { data, isSuccess } = useGetSimilar(
    { ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE },
    { keepPreviousData: true },
  );
  const similarParams = getSimilarParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers similar to" label="Similar Papers">
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={similarParams}
        />
      )}
    </AbsLayout>
  );
};

export default SimilarPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage);
