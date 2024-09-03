import { Stack } from '@chakra-ui/react';
import { InferGetServerSidePropsType, NextPage } from 'next';

import { getReferencesParams, useGetReferences } from '@/api';
import { FeedbackAlert, Pagination, SearchQueryLink, SimpleResultList, SimpleResultListSkeleton } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { withDetailsPage } from '@/hocs/withDetailsPage';
import { useGetAbstractParams } from '@/lib';
import { getStartFromPageAndRows } from '@/utils';

const ReferencesPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { doc, params: pageParams, page, error: pageError } = props;
  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode, getStartFromPageAndRows(page));

  const params = {
    ...getParams(),
    ...getReferencesParams(doc?.bibcode, getStartFromPageAndRows(page)),
  };

  const { data, error, isLoading } = useGetReferences(params, { keepPreviousData: true });

  return (
    <AbsLayout
      doc={doc}
      error={pageError}
      params={pageParams}
      titleDescription="Paper referenced by"
      label="References"
    >
      <Stack direction="column" spacing={1} mt={1} w="full">
        {isLoading ? <SimpleResultListSkeleton /> : null}
        {error ? <FeedbackAlert status="error" title="Unable to fetch citations" description={error.message} /> : null}
        {data ? (
          <>
            <SearchQueryLink params={params}>
              <>View as search results</>
            </SearchQueryLink>
            <SimpleResultList
              docs={data.docs}
              hideCheckboxes={true}
              indexStart={params?.start ?? 0}
              allowHighlight={false}
            />
            <Pagination
              totalResults={data.numFound}
              hidePerPageSelect
              page={page}
              onNext={onPageChange}
              onPrevious={onPageChange}
              onPageSelect={onPageChange}
              onlyUpdatePageParam
              skipRouting
            />
          </>
        ) : (
          <FeedbackAlert status="info" title="No Citations Found" />
        )}
      </Stack>
    </AbsLayout>
  );
};

export default ReferencesPage;

export const getServerSideProps = withDetailsPage;
