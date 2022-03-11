import { IDocsEntity } from '@api';
import { Link, Stack } from '@chakra-ui/layout';
import { ISimpleResultListProps, SimpleResultList } from '@components';
import { IPaginationProps, Pagination } from '@components/ResultList/Pagination';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { parseNumberAndClamp } from '@utils';
import NextLink, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';
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
  const pagination = usePagination({ numFound: totalResults });

  // call our page change handler on changes to pagination
  useEffect(() => {
    if (typeof onPageChange === 'function') {
      onPageChange(pagination.page, pagination.startIndex);
    }
  }, [pagination.page, pagination.startIndex]);

  // update the page on route change
  const router = useRouter();
  const routeChangeHandler = () => {
    const page = parseNumberAndClamp(router.query.p, 1);
    if (page !== pagination.page) {
      pagination.dispatch({ type: 'SET_PAGE', payload: page });
    }
  };

  // add/remove route change handlers
  useEffect(() => {
    router.events.on('routeChangeComplete', routeChangeHandler);
    return () => router.events.off('routeChangeComplete', routeChangeHandler);
  }, [router]);

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
