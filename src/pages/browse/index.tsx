import { Container } from '@chakra-ui/react';
import { NextPage } from 'next';
import { BRAND_NAME_FULL } from '@/config';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DatabaseItem, ExplorerLanding, isExplorerCollection } from '@/components/Explorer';
import { FacetItem } from '@/components/Explorer/FacetItem';

const BrowsePage: NextPage = () => {
  const router = useRouter();

  const collection = Array.isArray(router.query.collection) ? router.query.collection[0] : router.query.collection;

  const facet = Array.isArray(router.query.facet) ? router.query.facet[0] : router.query.facet;

  return (
    <Container maxW="container.xl" my={4} minH="container.sm">
      <Head>
        <title>{`${BRAND_NAME_FULL} - Explorer`}</title>
      </Head>
      {facet && isExplorerCollection(collection) ? (
        collection === 'database' ? (
          <DatabaseItem facetValue={facet} />
        ) : (
          <FacetItem cid={collection} facetKey={facet} />
        )
      ) : (
        <ExplorerLanding />
      )}
    </Container>
  );
};

export default BrowsePage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
