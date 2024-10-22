import { Stack } from '@chakra-ui/react';

import { Pagination, PaginationProps } from '@/components/ResultList/Pagination';
import { calculateStartIndex } from '@/components/ResultList/Pagination/usePagination';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { APP_DEFAULTS } from '@/config';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';
import { SimpleResultList } from '@/components/ResultList';
import { parseQueryFromUrl, stringifySearchParams } from '@/utils/common/search';
import { noop } from '@/utils/common/noop';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';

export interface IAbstractRefListProps {
  doc: IDocsEntity;
  docs: IDocsEntity[];
  searchLinkParams: IADSApiSearchParams;
  totalResults: PaginationProps['totalResults'];
  onPageChange: (start: number) => void;
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { docs, onPageChange = noop, totalResults, searchLinkParams } = props;
  const router = useRouter();
  const { p: page } = parseQueryFromUrl(router.asPath);
  const params = { ...searchLinkParams, start: calculateStartIndex(page, APP_DEFAULTS.RESULT_PER_PAGE) };

  const handlePageChange = (page: number) => {
    onPageChange(page - 1);
    void router.push({ pathname: router.pathname, search: stringifySearchParams({ ...router.query, p: page }) });
  };

  if (!docs) {
    return null;
  }

  return (
    <Stack direction="column" spacing={1} mt={1} w="full">
      <SearchQueryLink params={params}>
        <>View as search results</>
      </SearchQueryLink>
      <SimpleResultList docs={docs} hideCheckboxes={true} indexStart={params.start} allowHighlight={false} />
      <Pagination
        totalResults={totalResults}
        hidePerPageSelect
        page={page}
        onNext={handlePageChange}
        onPrevious={handlePageChange}
        onPageSelect={handlePageChange}
        onlyUpdatePageParam
        skipRouting
      />
    </Stack>
  );
};
