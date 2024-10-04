import { Flex, Heading, HStack } from '@chakra-ui/react';

import Head from 'next/head';
import { FC } from 'react';
import { UrlObject } from 'url';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { BRAND_NAME_FULL } from '@/config';
import { useRouter } from 'next/router';
import { VisualizationsTabs, VizSection } from '@/components/Visualizations';
import { SimpleLink } from '@/components/SimpleLink';

interface IVizPageLayoutProps {
  vizPage: VizSection;
  from?: UrlObject;
}

const sectionTitle: Readonly<Record<VizSection, string>> = {
  metrics: 'Metrics',
  concept_cloud: 'Concept Cloud',
  overview: 'Overview',
  author_network: 'Author Network',
  paper_network: 'Paper Network',
  results_graph: 'Results Graph',
} as const;

export const VizPageLayout: FC<IVizPageLayoutProps> = ({ children, vizPage, from }) => {
  const router = useRouter();
  const title = router.query?.q
    ? `${Array.isArray(router.query.q) ? router.query.q[0] : router.query.q} - ${BRAND_NAME_FULL} ${
        sectionTitle[vizPage]
      }`
    : `${sectionTitle[vizPage]} - ${BRAND_NAME_FULL}`;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Flex direction="column">
        <HStack my={10}>
          {from && (
            <SimpleLink href={from} aria-label="Back to search Results">
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
