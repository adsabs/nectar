import { Flex, Heading, HStack, Link } from '@chakra-ui/react';
import { VisualizationsTabs, VizSection } from '@components';
import NextLink from 'next/link';
import Head from 'next/head';
import { FC } from 'react';
import { UrlObject } from 'url';
import { ChevronLeftIcon } from '@chakra-ui/icons';
interface IVizPageLayoutProps {
  vizPage: VizSection;
  from?: UrlObject;
}

export const VizPageLayout: FC<IVizPageLayoutProps> = ({ children, vizPage, from }) => {
  return (
    <>
      <Head>
        <title>NASA Science Explorer - Metrics</title>
      </Head>
      <Flex direction="column">
        <HStack my={10}>
          {from && (
            <NextLink href={from} passHref>
              <Link aria-label="Back to search results">
                <ChevronLeftIcon w={8} h={8} />
              </Link>
            </NextLink>
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
