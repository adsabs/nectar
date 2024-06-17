import { IDocsEntity } from '@/api';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { AbstractSideNav, AbstractSources, Metatags, SimpleLink } from '@/components';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { unwrapStringValue } from '@/utils';
import { MathJax } from 'better-react-mathjax';
import Head from 'next/head';
import { PropsWithChildren } from 'react';

interface IAbsLayoutProps {
  doc: IDocsEntity;
  titleDescription: string;
}

export const AbsLayout = ({ children, doc, titleDescription }: PropsWithChildren<IAbsLayoutProps>) => {
  const { getSearchHref, show: showBackLink } = useBackToSearchResults();

  if (!doc) {
    return <>{children}</>;
  }

  const title = unwrapStringValue(doc?.title);

  return (
    <Stack direction="column" my={{ base: '6', lg: showBackLink ? '12' : '16' }}>
      {showBackLink && (
        <Flex>
          <Button
            as={SimpleLink}
            _hover={{ textDecoration: 'none' }}
            variant={'outline'}
            leftIcon={<ChevronLeftIcon />}
            fontSize="sm"
            fontWeight="normal"
            href={getSearchHref()}
          >
            Back to Results
          </Button>
        </Flex>
      )}
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={6}>
        <Head>
          <title>{title}</title>
          <Metatags doc={doc} />
        </Head>
        <Stack direction="column">
          <Box display={{ base: 'none', lg: 'block' }} maxW="72">
            <AbstractSources doc={doc} style="accordion" />
          </Box>
          <AbstractSideNav doc={doc} />
        </Stack>
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
