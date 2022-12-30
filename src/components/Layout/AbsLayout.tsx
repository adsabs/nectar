import { IDocsEntity } from '@api';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Heading, Stack, Text } from '@chakra-ui/layout';
import { Button, Link } from '@chakra-ui/react';
import { AbstractSideNav, Metatags } from '@components';
import { useBackToSearchResults } from '@hooks/useBackToSearchResults';
import { unwrapStringValue } from '@utils';
import Head from 'next/head';
import NextLink from 'next/link';
import { FC } from 'react';

interface IAbsLayoutProps {
  doc: IDocsEntity;
  titleDescription: string;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc, titleDescription }) => {
  const { getLinkProps, show: showBackLink } = useBackToSearchResults();

  if (typeof doc === 'undefined') {
    return <>{children}</>;
  }

  const title = unwrapStringValue(doc?.title);

  return (
    <Stack direction="column" my={{ base: '6', lg: showBackLink ? '12' : '16' }}>
      {showBackLink && (
        <NextLink {...getLinkProps()} legacyBehavior>
          <Link _hover={{ textDecoration: 'none' }}>
            <Button variant={'outline'} leftIcon={<ChevronLeftIcon />} fontSize="sm" fontWeight="normal">
              Back to Results
            </Button>
          </Link>
        </NextLink>
      )}
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={6}>
        <Head>
          <title>{title}</title>
          <Metatags doc={doc} />
        </Head>
        <AbstractSideNav doc={doc} />
        <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
          <Heading as="h2" id="title" fontSize="2xl" variant="abstract">
            <Text as="span" fontSize="xl">
              {titleDescription}
            </Text>{' '}
            <Text dangerouslySetInnerHTML={{ __html: title }} />
          </Heading>
          {children}
        </Stack>
      </Stack>
    </Stack>
  );
};
