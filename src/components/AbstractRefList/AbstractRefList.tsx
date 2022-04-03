import { IDocsEntity } from '@api';
import { Link, Stack } from '@chakra-ui/layout';
import { SimpleResultList } from '@components';
import { IPaginationProps, Pagination } from '@components/ResultList/Pagination';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { noop } from '@utils';
import NextLink, { LinkProps } from 'next/link';
import { ReactElement, useEffect } from 'react';
export interface IAbstractRefListProps {
  doc: IDocsEntity;
  docs: IDocsEntity[];
  href: LinkProps['href'];
  totalResults: IPaginationProps['totalResults'];
  onPageChange: (start: number) => void;
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { doc, docs, onPageChange = noop, href, totalResults } = props;
  const pagination = usePagination({ numFound: totalResults, updateURL: false });

  // reset pagination on doc change
  useEffect(() => pagination.dispatch({ type: 'RESET' }), [doc]);

  // call our page change handler on changes to pagination
  useEffect(() => onPageChange(pagination.startIndex), [pagination.page, pagination.startIndex]);

  return (
    <Stack direction="column" spacing={1} mt={1} w="full">
      <NextLink href={href} prefetch={false} passHref>
        <Link>View as search results</Link>
      </NextLink>
      <SimpleResultList docs={docs} hideCheckboxes={true} indexStart={pagination.startIndex} />
      <Pagination totalResults={totalResults} hidePerPageSelect {...pagination} />
    </Stack>
  );
};
