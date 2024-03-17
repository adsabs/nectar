import { IDocsEntity } from '@api';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { AbstractSideNav, Metatags, SimpleLink } from '@components';
import { useBackToSearchResults } from '@lib/useBackToSearchResults';
import { unwrapStringValue } from '@utils';
import { MathJax } from 'better-react-mathjax';
import Head from 'next/head';
import { FC } from 'react';

interface IAbsLayoutProps {
  doc: IDocsEntity;
  titleDescription: string;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc, titleDescription }) => {
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
