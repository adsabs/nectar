import { Stack } from '@chakra-ui/react';
import { InferGetServerSidePropsType, NextPage } from 'next';

import { getSimilarParams, useGetSimilar } from '@/api';
import { FeedbackAlert, Pagination, SearchQueryLink, SimpleResultList, SimpleResultListSkeleton } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { withDetailsPage } from '@/hocs/withDetailsPage';
import { useGetAbstractParams } from '@/lib';
import { getStartFromPageAndRows } from '@/utils';

const SimilarPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { doc, params: pageParams, page, error: pageError } = props;

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode, getStartFromPageAndRows(page));

  const params = {
    ...getParams(),
    ...getSimilarParams(doc?.bibcode, getStartFromPageAndRows(page)),
  };

  const { data, error, isLoading } = useGetSimilar(params, { keepPreviousData: true });

  return (
    <AbsLayout
      doc={doc}
      titleDescription="Papers similar to"
      label="Similar Papers"
      error={pageError}
      params={pageParams}
      isLoading={false}
    >
      <Stack direction="column" spacing={1} mt={1} w="full">
        {isLoading ? <SimpleResultListSkeleton /> : null}
        {error ? (
          <FeedbackAlert status="error" title="Unable to fetch similar papers" description={error.message} />
        ) : null}
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
          <FeedbackAlert status="info" title="No Similar Papers Found" />
        )}
      </Stack>
    </AbsLayout>
  );
};

export default SimilarPage;

export const getServerSideProps = withDetailsPage;
