import { Container } from '@chakra-ui/react';
import { NextPage } from 'next';
import { BRAND_NAME_FULL } from '@/config';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DatabaseItem, ExplorerLanding, isExplorerCollection } from '@/components/Explorer';
import { FacetItem } from '@/components/Explorer/FacetItem';

const BrowsePage: NextPage = () => {
  const router = useRouter();

  const { collection, facet } = router.query;

  return (
    <Container maxW="container.xl" my={4} minH="container.sm">
      <Head>
        <title>{`${BRAND_NAME_FULL} - Explorer`}</title>
      </Head>
      {collection && facet && isExplorerCollection(collection as string) ? (
        collection === 'database' ? (
          <DatabaseItem facetValue={facet as string} />
        ) : (
          <FacetItem cid={collection as string} facetKey={facet as string} />
        )
      ) : (
        <ExplorerLanding />
      )}
    </Container>
  );
};

export default BrowsePage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
