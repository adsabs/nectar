import { Flex, Heading, HStack } from '@chakra-ui/react';
import { SimpleLink, VisualizationsTabs, VizSection } from '@components';
import Head from 'next/head';
import { PropsWithChildren } from 'react';
import { UrlObject } from 'url';
import { ChevronLeftIcon } from '@chakra-ui/icons';

interface IVizPageLayoutProps {
  vizPage: VizSection;
  from?: UrlObject;
}

export const VizPageLayout = ({ children, vizPage, from }: PropsWithChildren<IVizPageLayoutProps>) => {
  return (
    <>
      <Head>
        <title>NASA Science Explorer - Metrics</title>
      </Head>
      <Flex direction="column">
        <HStack my={10}>
          {from && (
            <SimpleLink href={from.href} aria-label="Back to search results">
              <ChevronLeftIcon w={8} h={8} />
            </SimpleLink>
          )}
          <Heading as="h2" fontSize="2xl">
            Visualizations
          </Heading>
        </HStack>
        <VisualizationsTabs selectedSection={vizPage} />
        {children}
      </Flex>
    </>
  );
};
