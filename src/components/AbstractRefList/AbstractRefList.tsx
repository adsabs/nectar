import { IDocsEntity } from '@api';
import { Link, Stack } from '@chakra-ui/layout';
import { ISimpleResultListProps, SimpleResultList } from '@components';
import { IPaginationProps, Pagination } from '@components/ResultList/Pagination';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { useStore } from '@store';
import NextLink, { LinkProps } from 'next/link';
import { ReactElement, useEffect } from 'react';
export interface IAbstractRefListProps {
  docs: IDocsEntity[];
  indexStart: ISimpleResultListProps['indexStart'];
  href: LinkProps['href'];
  totalResults: IPaginationProps['totalResults'];
  onPageChange: (page: number, start: number) => void;
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { docs, onPageChange, href, totalResults, indexStart } = props;
  const storePagination = useStore((state) => state.pagination);
  const pagination = usePagination({ numFound: totalResults, ...storePagination });

  useEffect(() => {
    if (typeof onPageChange === 'function') {
      onPageChange(pagination.page, pagination.startIndex);
    }
  }, [pagination.page, pagination.startIndex]);

  return (
    <Stack direction="column" spacing={1} mt={1} w="full">
      <NextLink href={href} prefetch={false} passHref>
        <Link>View as search results</Link>
      </NextLink>
      <SimpleResultList docs={docs} hideCheckboxes={true} indexStart={indexStart} />
      <Pagination totalResults={totalResults} hidePerPageSelect {...pagination} />
    </Stack>
  );
};
