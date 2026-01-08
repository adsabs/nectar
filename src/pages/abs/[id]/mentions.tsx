import { getMentionsParams } from '@/api/search/models';
import { useGetAbstract, useGetMentions } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { NumPerPageType } from '@/types';

const MentionsPage: NextPage = () => {
  const router = useRouter();
  const {
    data: abstractDoc,
    error: abstractError,
    isLoading: absLoading,
    isFetching: absFetching,
  } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractDoc);
  const pageIndex = router.query.p ? parseInt(router.query.p as string) - 1 : 0;
  const { getParams, onPageChange, onPageSizeChange } = useGetAbstractParams(doc?.bibcode);
  const { rows } = getParams();

  // get the primary response from server (or cache)
  const {
    data,
    isSuccess,
    error: mentionsError,
    isLoading: mentionsLoading,
    isFetching: mentionsFetching,
  } = useGetMentions({ ...getParams(), start: pageIndex * rows });

  const isLoading = absLoading || absFetching || mentionsLoading || mentionsFetching;
  const mentionsParams = getMentionsParams(doc?.bibcode, 0, rows);

  const handlePageSizeChange = (n: NumPerPageType) => {
    onPageSizeChange(n);
  };

  return (
    <AbsLayout doc={doc} titleDescription="Papers mentioned by" label="mentions">
      {isLoading ? (
        <ItemsSkeleton count={10} />
      ) : (
        <>
          {(abstractError || mentionsError) && (
            <Alert status="error">
              <AlertIcon />
              {abstractError?.message || mentionsError?.message}
            </Alert>
          )}
          {isSuccess && (
            <AbstractRefList
              doc={doc}
              docs={data.docs}
              totalResults={data.numFound}
              onPageChange={onPageChange}
              pageSize={rows}
              onPageSizeChange={handlePageSizeChange}
              searchLinkParams={mentionsParams}
            />
          )}
        </>
      )}
    </AbsLayout>
  );
};

export default MentionsPage;

export const getServerSideProps = createAbsGetServerSideProps('mentions');
