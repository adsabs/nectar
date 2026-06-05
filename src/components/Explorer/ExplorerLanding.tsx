import { useGetSearchFacetJSON } from '@/api/search/search';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { kFormatNumber } from '@/utils/common/formatters';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { useDisclosure, Heading, Flex, Box, Card, CardBody, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { getSearchFacetParams, IUseGetFacetDataProps } from '../SearchFacet/useGetFacetData';
import { collectionSearchParams, collections, explorerFacets } from './data';
import { ViewCollectionModal } from './ViewCollectionModal';
import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';
import { IExplorerCollection } from './types';

const allRecordsQuery: IADSApiSearchParams = {
  q: '*:*',
  sort: APP_DEFAULTS.SORT,
  rows: 0,
};

const extractFacetVal = (key: string) => {
  return key.split('/').pop();
};

const searchFacetDefaultParams: IUseGetFacetDataProps & { offset: number; limit?: number } = {
  field: 'database',
  prefix: '',
  query: '',
  level: 'root',
  sortField: 'count',
  sortDir: 'desc',
  offset: 0,
  limit: 500,
};

export const ExplorerLanding = () => {
  // disciplines
  const {
    data: databaseData,
    isError: isDatabaseError,
    isLoading: isDatabaseLoading,
  } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: collectionSearchParams.database.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...collectionSearchParams.database,
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
    field: collectionSearchParams.doctype.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...collectionSearchParams.doctype,
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
    field: collectionSearchParams.bibgroup.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...collectionSearchParams.bibgroup,
    }),
  });

  // data collections
  const {
    data: dataData,
    isError: isDataError,
    isLoading: isDataLoading,
  } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: collectionSearchParams.data.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...collectionSearchParams.data,
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
        ? rtypeData?.doctype_facet_hier.buckets.filter((t) => (t.val as string).startsWith('1/')) // only show child record types
        : id === 'bibgroup'
        ? bibgroupData?.bibgroup_facet.buckets
        : id === 'data'
        ? dataData?.data_facet.buckets
        : []) ?? [],
    );
    onOpen();
  };

  const handleSelectFacet = (facetKey: string) => {
    console.log(facetKey);
    onClose();
  };

  return (
    <>
      <Heading as="h2">Browse by...</Heading>
      <Flex direction="column" mt={4} gap={12} w="full">
        <Box as="section" w="full">
          <Heading as="h3" size="md" mb={2}>
            {collections.database.label}
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
                onClick={() => handleSelectFacet(discipline.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(discipline.facetKey);
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
              {collections.doctype.label}
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
                onClick={() => handleSelectFacet(rt.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(rt.facetKey);
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
                            rtypeData.doctype_facet_hier.buckets.find((t) => extractFacetVal(t.val as string) === rt.id)
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
              {collections.bibgroup.label}
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
                onClick={() => handleSelectFacet(bg.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(bg.facetKey);
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
                              (bibgroup) => extractFacetVal(bibgroup.val as string) === bg.id,
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
              {collections.data.label}
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
                onClick={() => handleSelectFacet(dc.facetKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFacet(dc.facetKey);
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
                            dataData.data_facet.buckets.find((data) => extractFacetVal(data.val as string) === dc.id)
                              ?.count || 0,
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
          label={collections[focusedCollection]?.label}
          data={focusedData}
          isOpen={isOpen}
          onClose={onClose}
          onSelectFacet={handleSelectFacet}
        />
      </Flex>
    </>
  );
};
