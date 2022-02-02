import { Link, Stack } from '@chakra-ui/layout';
import NextLink from 'next/link';
import { SimpleResultList } from '@components';
import { IADSApiSearchParams, IDocsEntity } from '@api';
import { ReactElement } from 'react';

interface IAbstractRefListProps {
  query: IADSApiSearchParams;
  docs: IDocsEntity[];
  resultsLinkHref: string;
  numFound: number;
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { query, docs, resultsLinkHref, numFound } = props;

  return (
    <Stack direction="column" spacing={1} mt={1} w="full">
      <NextLink href={resultsLinkHref} passHref>
        <Link>View as search results</Link>
      </NextLink>
      <SimpleResultList query={query} numFound={numFound} docs={docs} hideCheckboxes={true} />
    </Stack>
  );
};
