import { Stack } from '@chakra-ui/react';
import { Pagination, PaginationProps } from '@/components/ResultList/Pagination';
import { calculateStartIndex } from '@/components/ResultList/Pagination/usePagination';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';
import { SimpleResultList } from '@/components/ResultList';
import { parseQueryFromUrl, stringifySearchParams } from '@/utils/common/search';
import { noop } from '@/utils/common/noop';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { NumPerPageType } from '@/types';

export interface IAbstractRefListProps {
  doc: IDocsEntity;
  docs: IDocsEntity[];
  searchLinkParams: IADSApiSearchParams;
  totalResults: PaginationProps['totalResults'];
  pageSize: NumPerPageType;
  onPageChange: (start: number) => void;
  onPageSizeChange: (pageSize: NumPerPageType) => void;
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { docs, pageSize, onPageChange = noop, onPageSizeChange, totalResults, searchLinkParams } = props;
  const router = useRouter();
  const { p: page } = parseQueryFromUrl(router.asPath);
  const params = { ...searchLinkParams, start: calculateStartIndex(page, pageSize) };

  const handlePageChange = (page: number) => {
    onPageChange(page - 1);
    void router.push({ pathname: router.pathname, search: stringifySearchParams({ ...router.query, p: page }) });
  };

  const handlePageSizeChange = (pageSize: NumPerPageType) => {
    // reset to first page to prevent invalid page number on num per page change
    handlePageChange(1);
    onPageSizeChange(pageSize);
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
        page={page}
        numPerPage={pageSize}
        onNext={handlePageChange}
        onPrevious={handlePageChange}
        onPageSelect={handlePageChange}
        onPerPageSelect={handlePageSizeChange}
        onlyUpdatePageParam
        skipRouting
      />
    </Stack>
  );
};
