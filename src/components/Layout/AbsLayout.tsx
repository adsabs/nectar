import { IDocsEntity } from '@api';
import { Heading, Stack, Text } from '@chakra-ui/layout';
import { AbstractSideNav, Metatags } from '@components';
import Head from 'next/head';
import { FC } from 'react';

interface IAbsLayoutProps {
  doc: IDocsEntity;
  titleDescription: string;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc, titleDescription }) => {
  if (typeof doc === 'undefined') {
    return <>{children}</>;
  }

  return (
    <Stack direction={{ base: 'column', lg: 'row' }} my={{ base: '6', lg: '16' }} spacing={6}>
      <Head>
        <title>{doc?.title ?? ''}</title>
        <Metatags doc={doc} />
      </Head>
      <AbstractSideNav doc={doc} />
      <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
        <Heading as="h2" id="title" fontSize="2xl" variant="abstract">
          <Text as="span" fontSize="xl">
            {titleDescription}
          </Text>{' '}
          <Text>{doc.title}</Text>
        </Heading>
        {children}
      </Stack>
    </Stack>
  );
};
