import { Flex, Heading, HStack } from '@chakra-ui/react';
import { VisualizationsTabs, VizSection } from '@components';
import Link from 'next/link';
import Head from 'next/head';
import { FC } from 'react';
import { Url } from 'url';

interface IVizPageLayoutProps {
  from: Url;
  vizPage: VizSection;
}

export const VizPageLayout: FC<IVizPageLayoutProps> = ({ children, from, vizPage }) => {
  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Metrics</title>
      </Head>
      <Flex direction="column">
        <HStack>
          {from && <Link href={from}>{'< '}</Link>}
          <Heading as="h2" fontSize="xl">
            Visualizations
          </Heading>
        </HStack>
        <VisualizationsTabs selectedSection={vizPage} />
        {children}
      </Flex>
    </div>
  );
};
