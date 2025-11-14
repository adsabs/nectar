import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';

import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { MathJax } from 'better-react-mathjax';
import Head from 'next/head';
import { FC } from 'react';
import { BRAND_NAME_FULL } from '@/config';
import { Metatags } from '@/components/Metatags';
import { SimpleLink } from '@/components/SimpleLink';
import { AbstractSources } from '@/components/AbstractSources';
import { AbstractSideNav } from '@/components/AbstractSideNav';
import { unwrapStringValue } from '@/utils/common/formatters';
import { IDocsEntity } from '@/api/search/types';

interface IAbsLayoutProps {
  doc?: IDocsEntity | null;
  titleDescription: string;
  label: string;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc, titleDescription, label }) => {
  const { getSearchHref, show: showBackLink } = useBackToSearchResults();

  const hasDoc = Boolean(doc);
  const title = hasDoc ? unwrapStringValue(doc.title) : '';
  const pageTitle = hasDoc ? `${title} - ${BRAND_NAME_FULL} ${label}` : `${BRAND_NAME_FULL} ${label}`;

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
          <title>{pageTitle}</title>
          {hasDoc ? <Metatags doc={doc} /> : null}
        </Head>
        <Stack direction="column">
          <Box display={{ base: 'none', lg: 'block' }} w="72">
            {hasDoc ? <AbstractSources doc={doc} style="accordion" /> : null}
          </Box>
          {hasDoc ? <AbstractSideNav doc={doc} /> : null}
        </Stack>
        <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
          <Heading as="h2" id="abstract-subview-title" fontSize="2xl" variant="abstract">
            <Text as="span" fontSize="xl">
              {titleDescription}
            </Text>{' '}
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: title }} />
          </Heading>
          <div id="abstract-subview-content">{children}</div>
        </Stack>
      </Stack>
    </Stack>
  );
};
