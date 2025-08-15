import { getMentionsParams } from '@/api/search/models';
import { useGetAbstract, useGetMentions } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout';
import { ItemsSkeleton } from '@/components/ResultList';
import { APP_DEFAULTS } from '@/config';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { path } from 'ramda';

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
  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  // get the primary response from server (or cache)
  const {
    data,
    isSuccess,
    error: mentionsError,
    isLoading: mentionsLoading,
    isFetching: mentionsFetching,
  } = useGetMentions({ ...getParams(), start: pageIndex * APP_DEFAULTS.RESULT_PER_PAGE }, { keepPreviousData: true });

  const isLoading = absLoading || absFetching || mentionsLoading || mentionsFetching;
  const mentionsParams = getMentionsParams(doc?.bibcode, 0);

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
              searchLinkParams={mentionsParams}
            />
          )}
        </>
      )}
    </AbsLayout>
  );
};

export default MentionsPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
