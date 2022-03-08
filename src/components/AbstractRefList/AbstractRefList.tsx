import { IDocsEntity } from '@api';
import { Link, Stack } from '@chakra-ui/layout';
import { ISimpleResultListProps, SimpleResultList } from '@components';
import { IPaginationProps, Pagination } from '@components/ResultList/Pagination';
import NextLink, { LinkProps } from 'next/link';
import { ReactElement } from 'react';
export interface IAbstractRefListProps {
  docs: IDocsEntity[];
  indexStart: ISimpleResultListProps['indexStart'];
  href: LinkProps['href'];
  totalResults: IPaginationProps['totalResults'];
  onPageChange: IPaginationProps['onPageChange'];
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { docs, href, totalResults, onPageChange, indexStart } = props;

  return (
    <Stack direction="column" spacing={1} mt={1} w="full">
      <NextLink href={href} prefetch={false} passHref>
        <Link>View as search results</Link>
      </NextLink>
      <SimpleResultList docs={docs} hideCheckboxes={true} indexStart={indexStart} />
      <Pagination totalResults={totalResults} numPerPage={10} onPageChange={onPageChange} />
    </Stack>
  );
};
