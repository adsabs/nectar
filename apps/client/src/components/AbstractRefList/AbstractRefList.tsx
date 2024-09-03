import { Stack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { isNonEmptyString } from 'ramda-adjunct';
import { ReactElement } from 'react';

import { IADSApiSearchParams, useGetReferences } from '@/api';
import { FeedbackAlert, LoadingMessage, SimpleResultList } from '@/components';
import { Pagination } from '@/components/ResultList/Pagination';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { getStartFromPageAndRows, parseAPIError, stringifySearchParams } from '@/utils';

export interface IAbstractRefListProps {
  id?: string;
  params?: IADSApiSearchParams;
  page: number;
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { id, params, page } = props;
  const router = useRouter();

  const { data, isLoading, error } = useGetReferences(
    { bibcode: id, start: getStartFromPageAndRows(page) },
    { enabled: isNonEmptyString(id) },
  );

  if (error) {
    return (
      <Stack direction="column" spacing={1} mt={1} w="full">
        <FeedbackAlert status="error" title={parseAPIError(error)} />
      </Stack>
    );
  }

  if (isLoading) {
    return <LoadingMessage message="Loading References" />;
  }

  const handlePageChange = (page: number) => {
    void router.push({ pathname: router.pathname, search: stringifySearchParams({ ...router.query, p: page }) });
  };

  return (
    <Stack direction="column" spacing={1} mt={1} w="full">
      <SearchQueryLink params={params}>
        <>View as search results</>
      </SearchQueryLink>
      {data ? (
        <>
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
            onNext={handlePageChange}
            onPrevious={handlePageChange}
            onPageSelect={handlePageChange}
            onlyUpdatePageParam
            skipRouting
          />
        </>
      ) : (
        <>No References Found</>
      )}
    </Stack>
  );
};
