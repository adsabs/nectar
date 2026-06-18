import { Flex, Heading } from '@chakra-ui/react';

import Head from 'next/head';
import { FC } from 'react';
import { UrlObject } from 'url';
import { BRAND_NAME_FULL } from '@/config';
import { useRouter } from 'next/router';
import { VisualizationsTabs, VizSection } from '@/components/Visualizations';
import { BackToSearchResults } from '@/components/BackToSearchResults';

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

  // The viz page URL is canonical, so reconstruction from `from` outranks any
  // captured session URL (with session as fallback if `from` is absent).
  const reconstructed = from && typeof from.query === 'string' ? `${from.pathname ?? '/search'}?${from.query}` : null;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Flex direction="column">
        <BackToSearchResults reconstructed={reconstructed} preferReconstructed buttonProps={{ mt: 6 }} />
        <Heading as="h2" fontSize="2xl" mt={2} mb={6}>
          Visualizations
        </Heading>
        <VisualizationsTabs selectedSection={vizPage} />
        {children}
      </Flex>
    </>
  );
};
