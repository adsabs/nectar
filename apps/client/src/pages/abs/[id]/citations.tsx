import { getCitationsParams, IDocsEntity, useGetAbstract, useGetCitations } from '@/api';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { withDetailsPage } from '@/hocs/withDetailsPage';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import { composeNextGSSP } from '@/ssr-utils';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { APP_DEFAULTS } from '@/config';

const CitationsPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractDoc, error: abstractError } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractDoc);
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;
  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  // get the primary response from server (or cache)
  const {
    data,
    isSuccess,
    error: citationsError,
  } = useGetCitations({ ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE }, { keepPreviousData: true });
  const citationsParams = getCitationsParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers that cite" label="Citations">
      {(abstractError || citationsError) && (
        <Alert status="error">
          <AlertIcon />
          {abstractError?.message || citationsError?.message}
        </Alert>
      )}
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={citationsParams}
        />
      )}
    </AbsLayout>
  );
};

export default CitationsPage;

export const getServerSideProps = composeNextGSSP(withDetailsPage);
