import { useGetSearchFacetJSON } from '@/api/search/search';
import { bibgroupDescriptions } from '@/components/Explorer/bibgroup_data';
import { explorerCollections } from '@/components/Explorer/data';
import { dataDescriptions } from '@/components/Explorer/data_data';
import { doctypeDescriptions } from '@/components/Explorer/doctype_data';
import { allRecordsQuery, searchFacetDefaultParams } from '@/components/Explorer/helpers';
import { IExplorerCollection, isExplorerCollection } from '@/components/Explorer/types';
import { CustomInfoMessage } from '@/components/Feedbacks';
import { parseTitleFromKey } from '@/components/SearchFacet/helpers';
import { getSearchFacetParams } from '@/components/SearchFacet/useGetFacetData';
import { SimpleLink } from '@/components/SimpleLink';
import { BRAND_NAME_FULL } from '@/config';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { kFormatNumber } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { CardBody, Flex, Heading, Text, Card, Container, Skeleton, Box, Center } from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';

import { useRouter } from 'next/router';
import { useMemo } from 'react';

const CollectionPage: NextPage = () => {
  const router = useRouter();

  const collection = router.query.collection as string;

  const colors = useColorModeColors();

  const searchParams = useMemo(() => {
    return {
      ...allRecordsQuery,
      filter: [] as string[],
      field: explorerCollections[collection].facetSearchParams.field,
      ['json.facet']: getSearchFacetParams({
        ...searchFacetDefaultParams,
        ...explorerCollections[collection].facetSearchParams,
      }),
    };
  }, [collection]);

  // disciplines
  const { data, isError, isLoading, error } = useGetSearchFacetJSON(searchParams, {
    enabled: collection && isExplorerCollection(collection),
  });

  const getFacetValue = (val: string) => {
    const regex = /^[01]\/(.*)/;
    return regex.test(val) ? parseTitleFromKey(val) : val;
  };

  // get collection (facet) data
  const collectionData = useMemo(() => {
    return (
      (collection === 'database'
        ? data?.database.buckets
        : collection === 'doctype'
        ? data?.doctype_facet_hier.buckets.filter(
            (t) => !explorerCollections.doctype.ignoreFacetKeys.includes(t.val as string),
          )
        : collection === 'bibgroup'
        ? data?.bibgroup_facet.buckets
        : collection === 'data'
        ? data?.data_facet.buckets.filter((t) => explorerCollections.data.filterFacetKeys.includes(t.val as string))
        : []) ?? []
    );
  }, [data, collection]);

  const descriptions = useMemo(() => {
    return collection === 'doctype'
      ? doctypeDescriptions
      : collection === 'bibgroup'
      ? bibgroupDescriptions
      : collection === 'data'
      ? dataDescriptions
      : {};
  }, [collection]);

  const handleSelectFacet = (collection: IExplorerCollection['id'], facet: string) => {
    router.push({ pathname: '/browse', query: { collection: collection, facet: facet } });
  };

  if (!collection || !isExplorerCollection(collection) || collection === 'database') {
    return null;
  }

  return (
    <Container maxW="container.xl" my={4} minH="container.sm">
      <Head>
        <title>{`${BRAND_NAME_FULL} - Explorer - ${explorerCollections[collection].label}`}</title>
      </Head>
      <Flex direction="column" gap={6}>
        <SimpleLink href="/browse">
          <ArrowBackIcon boxSize={5} mr={2} />
          Back to Explore
        </SimpleLink>
        <Heading as="h2">{explorerCollections[collection].label}</Heading>
        <Flex as="section" gap={4} width="full" flexWrap="wrap">
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <Center>
              <CustomInfoMessage
                status="error"
                alertTitle="An error has occurred"
                description={parseAPIError(error) ?? 'An error occurred'}
                width="full"
              />
            </Center>
          ) : (
            <>
              {collectionData.map((facetKey) => (
                <Card
                  key={`recordType-${facetKey.val}`}
                  minW={270}
                  maxW={270}
                  minH={100}
                  flex={1}
                  cursor="pointer"
                  transition="all 0.3s ease-in-out"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    transition: 'opacity 0.2s ease-in-out',
                  }}
                  _hover={{
                    transform: 'scale(1.05)',
                    zIndex: 1,
                    boxShadow: 'xl',
                  }}
                  tabIndex={0}
                  onClick={() => handleSelectFacet(collection, facetKey.val as string)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectFacet(collection, facetKey.val as string);
                    }
                  }}
                >
                  <CardBody display="flex" position="relative" zIndex={1}>
                    <Flex w="100%" alignItems="center">
                      <Box
                        as={descriptions[facetKey.val as string]?.icon}
                        boxSize={12}
                        mr={4}
                        flexShrink={0}
                        aria-hidden
                      />
                      <Flex direction="column">
                        <Text fontSize="lg" fontWeight="bold">
                          {getFacetValue(facetKey.val as string)}
                        </Text>
                        {descriptions[facetKey.val as string]?.desc && (
                          <Text fontSize="sm" color={colors.lightText}>
                            {descriptions[facetKey.val as string].desc}
                          </Text>
                        )}
                        {!isError && !isLoading && (
                          <Text fontSize="sm">{kFormatNumber(facetKey.count || 0)} records</Text>
                        )}
                      </Flex>
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </>
          )}
        </Flex>
      </Flex>
    </Container>
  );
};

const LoadingSkeleton = () => (
  <>
    {[...Array(12)].map((_, index) => (
      <Skeleton key={`skeleton-${index}`} minW={270} maxW={270} minH={100} flex={1} />
    ))}
  </>
);

export default CollectionPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
