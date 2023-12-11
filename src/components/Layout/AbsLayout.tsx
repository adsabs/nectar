import { IDocsEntity } from '@api';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { AbstractSideNav, Metatags, SimpleLink } from '@components';
import { useBackToSearchResults } from '@lib/useBackToSearchResults';
import { unwrapStringValue } from '@utils';
import { MathJax } from 'better-react-mathjax';
import Head from 'next/head';
import { PropsWithChildren } from 'react';

interface IAbsLayoutProps {
  doc: IDocsEntity;
  titleDescription: string;
}

export const AbsLayout = ({ children, doc, titleDescription }: PropsWithChildren<IAbsLayoutProps>) => {
  const { getLinkProps, show: showBackLink } = useBackToSearchResults();

  if (!doc) {
    return <>{children}</>;
  }

  const title = unwrapStringValue(doc?.title);

  return (
    <Stack direction="column" my={{ base: '6', lg: showBackLink ? '12' : '16' }}>
      {showBackLink && (
        <SimpleLink {...getLinkProps()} _hover={{ textDecoration: 'none' }}>
          <Button variant={'outline'} leftIcon={<ChevronLeftIcon />} fontSize="sm" fontWeight="normal">
            Back to Results
          </Button>
        </SimpleLink>
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
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
          </Heading>
          {children}
        </Stack>
      </Stack>
    </Stack>
  );
};
