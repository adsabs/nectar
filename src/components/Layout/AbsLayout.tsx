import { Box, Heading, Stack, Text } from '@chakra-ui/react';

import { MathJax } from 'better-react-mathjax';
import Head from 'next/head';
import { FC } from 'react';
import { BRAND_NAME_FULL } from '@/config';
import { Metatags } from '@/components/Metatags';
import { AbstractSources } from '@/components/AbstractSources';
import { AbstractSideNav } from '@/components/AbstractSideNav';
import { stripHtml, unwrapStringValue } from '@/utils/common/formatters';
import { IDocsEntity } from '@/api/search/types';
import { AbstractSearchForm } from '@/components/AbstractSearchForm';

interface IAbsLayoutProps {
  doc?: IDocsEntity;
  titleDescription: string;
  label: string;
}

export const AbsLayout: FC<IAbsLayoutProps> = ({ children, doc, titleDescription, label }) => {
  const rawTitle = doc ? unwrapStringValue(doc.title) : '';
  const title = stripHtml(rawTitle);
  const suffix = `${BRAND_NAME_FULL} ${label}`;
  const pageTitle = title ? `${title} - ${suffix}` : suffix;

  return (
    <Stack direction="column" pt="10" spacing={10}>
      <Head>
        <title>{pageTitle}</title>
        {doc && <Metatags doc={doc} />}
      </Head>
      {!doc ? (
        children
      ) : (
        <>
          <AbstractSearchForm />
          <Stack direction={{ base: 'column', lg: 'row' }} spacing={6}>
            <Stack direction="column">
              <Box display={{ base: 'none', lg: 'block' }} w="72">
                <AbstractSources doc={doc} style="accordion" />
              </Box>
              <AbstractSideNav doc={doc} />
            </Stack>
            <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
              <Heading as="h2" id="abstract-subview-title" fontSize="2xl" variant="abstract">
                <Text as="span" fontSize="xl">
                  {titleDescription}
                </Text>{' '}
                <Text as={MathJax} dangerouslySetInnerHTML={{ __html: rawTitle }} />
              </Heading>
              <div id="abstract-subview-content">{children}</div>
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
};
