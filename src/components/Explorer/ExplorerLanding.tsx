import { useGetSearchFacetJSON } from '@/api/search/search';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { kFormatNumber } from '@/utils/common/formatters';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { useDisclosure, Heading, Flex, Box, Card, CardBody, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { getSearchFacetParams } from '../SearchFacet/useGetFacetData';
import { explorerCollections, explorerFacets } from './data';
import { ViewCollectionModal } from './ViewCollectionModal';
import { IExplorerCollection } from './types';
import { useRouter } from 'next/router';
import { allRecordsQuery, searchFacetDefaultParams } from './helpers';

export const ExplorerLanding = () => {
  const router = useRouter();

  // disciplines
  const {
    data: databaseData,
    isError: isDatabaseError,
    isLoading: isDatabaseLoading,
  } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: explorerCollections.database.facetSearchParams.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...explorerCollections.database.facetSearchParams,
    }),
  });

  // record types
  const {
    data: rtypeData,
    isError: isRtypeError,
    isLoading: isRtypeLoading,
  } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: explorerCollections.doctype.facetSearchParams.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...explorerCollections.doctype.facetSearchParams,
    }),
  });

  // bibgroups
  const {
    data: bibgroupData,
    isError: isBibgroupError,
    isLoading: isBibgroupLoading,
  } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: explorerCollections.bibgroup.facetSearchParams.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...explorerCollections.bibgroup.facetSearchParams,
    }),
  });

  // data bibliographies
  const {
    data: dataData,
    isError: isDataError,
    isLoading: isDataLoading,
  } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: explorerCollections.data.facetSearchParams.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...explorerCollections.data.facetSearchParams,
    }),
  });

  const colors = useColorModeColors();

  const [focusedCollection, setFocusedCollection] = useState<IExplorerCollection['id']>('database');

  const [focusedData, setFocusedData] = useState<{ val: number | string; count: number }[]>([]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleViewAll = (id: IExplorerCollection['id']) => {
    setFocusedCollection(id);
    setFocusedData(
      (id === 'database'
        ? databaseData?.database.buckets
        : id === 'doctype'
        ? rtypeData?.doctype_facet_hier.buckets.filter(
            (t) => !explorerCollections.doctype.ignoreFacetKeys.includes(t.val as string),
          )
        : id === 'bibgroup'
        ? bibgroupData?.bibgroup_facet.buckets
        : id === 'data'
        ? dataData?.data_facet.buckets.filter((t) => explorerCollections.data.filterFacetKeys.includes(t.val as string))
        : []) ?? [],
    );
    onOpen();
  };

  const handleSelectFacet = (collection: IExplorerCollection['id'], facet: string) => {
    router.push({ pathname: router.pathname, query: { collection, facet: facet } });
    onClose();
  };

  return (
    <>
      <Heading as="h2">Browse by...</Heading>
      <Flex direction="column" mt={4} gap={12} w="full">
        <Box as="section" w="full">
          <Heading as="h3" size="md" mb={2}>
            {explorerCollections.database.label}
          </Heading>
          <Flex gap={4} width="full" flexWrap="wrap">
            {explorerFacets.database.map((discipline) => (
              <Card
                key={`discipline-${discipline.label}`}
                minW={200}
                minH={150}
                bgImage={`url('${discipline.image}')`}
                bgSize="cover"
                bgPosition="center"
                flex={1}
                cursor="pointer"
                transition="all 0.3s ease-in-out"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  bg: 'blackAlpha.300', // dark overlay
                  transition: 'opacity 0.2s ease-in-out',
                }}
                _hover={{
                  transform: 'scale(1.05)',
                  zIndex: 1,
                  boxShadow: 'xl',
                  _before: { opacity: 0 }, // Fades out the dark overlay
                }}
                tabIndex={0}
                onClick={() => handleSelectFacet(explorerCollections.database.id, discipline.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(explorerCollections.database.id, discipline.facetKey);
                  }
                }}
              >
                <CardBody display="flex" alignItems="end" color="white" position="relative" zIndex={1}>
                  <Flex justifyContent="space-between" alignItems="end" w="100%">
                    <Flex direction="column">
                      <Text fontSize="lg" fontWeight="bold">
                        {discipline.label}
                      </Text>
                      {!isDatabaseLoading && !isDatabaseError && (
                        <Text fontSize="sm" fontWeight="normal">
                          {kFormatNumber(
                            databaseData.database.buckets.find((db) => db.val === discipline.id)?.count || 0,
                          )}{' '}
                          records
                        </Text>
                      )}
                    </Flex>
                    <ArrowForwardIcon boxSize={5} />
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Flex>
        </Box>
        <Box as="section" w="full">
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading as="h3" size="md" mb={2}>
              {explorerCollections.doctype.label}
            </Heading>
            <Text
              fontSize="sm"
              color={colors.link}
              cursor="pointer"
              fontWeight="bold"
              onClick={() => handleViewAll('doctype')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewAll('doctype');
                }
              }}
            >
              View all <ArrowForwardIcon boxSize={5} aria-hidden />
            </Text>
          </Flex>
          <Flex gap={4} width="full" flexWrap="wrap">
            {explorerFacets.doctype.map((rt) => (
              <Card
                key={`recordType-${rt.label}`}
                minW={200}
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
                onClick={() => handleSelectFacet(explorerCollections.doctype.id, rt.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(explorerCollections.doctype.id, rt.facetKey);
                  }
                }}
              >
                <CardBody display="flex" position="relative" zIndex={1}>
                  <Flex w="100%" alignItems="center">
                    <Box as={rt.icon} boxSize={12} mr={4} flexShrink={0} aria-hidden />
                    <Flex direction="column">
                      <Text fontSize="lg" fontWeight="bold">
                        {rt.label}
                      </Text>
                      {!isRtypeError && !isRtypeLoading && (
                        <Text fontSize="sm">
                          {kFormatNumber(
                            rtypeData.doctype_facet_hier.buckets.find((t) => (t.val as string) === rt.facetKey)
                              ?.count || 0,
                          )}{' '}
                          records
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Flex>
        </Box>
        <Box as="section" w="full">
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading as="h3" size="md" mb={2}>
              {explorerCollections.bibgroup.label}
            </Heading>
            <Text
              fontSize="sm"
              color={colors.link}
              cursor="pointer"
              fontWeight="bold"
              onClick={() => handleViewAll('bibgroup')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewAll('bibgroup');
                }
              }}
            >
              View all <ArrowForwardIcon boxSize={5} aria-hidden />
            </Text>
          </Flex>
          <Flex gap={4} width="full" flexWrap="wrap">
            {explorerFacets.bibgroup.map((bg) => (
              <Card
                key={`curatedBib-${bg.label}`}
                minW={200}
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
                onClick={() => handleSelectFacet(explorerCollections.bibgroup.id, bg.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(explorerCollections.bibgroup.id, bg.facetKey);
                  }
                }}
              >
                <CardBody display="flex" position="relative" zIndex={1}>
                  <Flex w="100%" alignItems="center">
                    <Box as={bg.icon} boxSize={12} mr={4} flexShrink={0} aria-hidden />
                    <Flex direction="column">
                      <Text fontSize="lg" fontWeight="bold">
                        {bg.label}
                      </Text>
                      {!isBibgroupLoading && !isBibgroupError && (
                        <Text fontSize="sm">
                          {kFormatNumber(
                            bibgroupData.bibgroup_facet.buckets.find(
                              (bibgroup) => (bibgroup.val as string) === bg.facetKey,
                            )?.count || 0,
                          )}{' '}
                          records
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Flex>
        </Box>
        <Box as="section" w="full">
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading as="h3" size="md" mb={2}>
              {explorerCollections.data.label}
            </Heading>
            <Text
              fontSize="sm"
              color={colors.link}
              cursor="pointer"
              fontWeight="bold"
              onClick={() => handleViewAll('data')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewAll('data');
                }
              }}
            >
              View all <ArrowForwardIcon boxSize={5} aria-hidden />
            </Text>
          </Flex>
          <Flex gap={4} width="full" flexWrap="wrap">
            {explorerFacets.data.map((dc) => (
              <Card
                key={`curatedDC-${dc.label}`}
                minW={200}
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
                onClick={() => handleSelectFacet(explorerCollections.data.id, dc.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(explorerCollections.data.id, dc.facetKey);
                  }
                }}
              >
                <CardBody display="flex" position="relative" zIndex={1}>
                  <Flex w="100%" alignItems="center">
                    <Box as={dc.icon} boxSize={12} mr={4} flexShrink={0} aria-hidden />
                    <Flex direction="column">
                      <Text fontSize="lg" fontWeight="bold">
                        {dc.label}
                      </Text>
                      {!isDataLoading && !isDataError && (
                        <Text fontSize="sm">
                          {kFormatNumber(
                            dataData.data_facet.buckets.find((data) => (data.val as string) === dc.facetKey)?.count ||
                              0,
                          )}{' '}
                          records
                        </Text>
                      )}{' '}
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Flex>
        </Box>
        <ViewCollectionModal
          collectionId={focusedCollection}
          label={explorerCollections[focusedCollection]?.label}
          data={focusedData}
          isOpen={isOpen}
          onClose={onClose}
          onSelectFacet={handleSelectFacet}
        />
      </Flex>
    </>
  );
};
