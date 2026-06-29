import { SimpleLink } from '@/components/SimpleLink';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { databases, explorerCollections } from './data';
import { useGetSearchFacetJSON } from '@/api/search/search';
import { getSearchFacetParams } from '../SearchFacet/useGetFacetData';
import { allRecordsQuery, makeDataGroupSearchLink, makeJournalSearchLink, searchFacetDefaultParams } from './helpers';
import { kFormatNumber } from '@/utils/common/formatters';
import { IADSApiSearchParams } from '@/api/search/types';
import { useMemo, useState } from 'react';
import { FeaturedPapers } from './FeaturedPapers';
import { FacetFieldTable } from './FacetFieldTable';
import { applyFiltersToQuery, parseTitleFromKey } from '../SearchFacet/helpers';
import { pipe } from 'ramda';
import { SubFacetCard } from './SubFacetCard';
import { IExplorerCollection } from './types';
import { OverTimeChart } from './OverTimeChart';

const databaseFacetIds = ['astrophysics', 'heliophysics', 'planetary', 'earthscience'];

export const FacetItem = ({ cid, facetKey }: { cid: IExplorerCollection['id']; facetKey: string }) => {
  const collection = explorerCollections[cid];

  const facet = parseTitleFromKey(facetKey);

  const databaseFacets = databaseFacetIds.map((id) => databases[id]);

  const [database, setDatabase] = useState<(typeof databaseFacetIds)[number] | null>(null);

  // Use facet search to get record counts
  const { data: countData } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: explorerCollections[cid].facetSearchParams.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...explorerCollections[cid].facetSearchParams,
    }),
  });

  const { data: databaseFacetCountData } = useGetSearchFacetJSON({
    ...(applyFiltersToQuery({
      query: allRecordsQuery,
      values: [facetKey],
      field: collection.facetField,
      logic: 'or',
    }) as IADSApiSearchParams),
    filter: [],
    field: explorerCollections.database.facetSearchParams.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...explorerCollections.database.facetSearchParams,
    }),
  });

  // The main query for the page
  const searchQueryParams: IADSApiSearchParams = useMemo(() => {
    return pipe(
      // Apply doctype filter
      (q: IADSApiSearchParams) =>
        applyFiltersToQuery({
          query: q,
          values: [facetKey],
          field: collection.facetField,
          logic: 'or',
        }),

      //  Optional database filter
      (q) =>
        database
          ? (applyFiltersToQuery({
              query: q as IADSApiSearchParams,
              values: [database],
              field: 'database',
              logic: 'or',
            }) as IADSApiSearchParams)
          : (q as IADSApiSearchParams),
    )(allRecordsQuery);
  }, [database, facet]);

  const handleSelectDatabase = (selected: (typeof databaseFacetIds)[number]) => {
    if (selected === database) {
      setDatabase(null); // unselect
    } else {
      setDatabase(selected);
    }
  };

  if (facet) {
    return (
      <Flex direction="column" gap={6}>
        <SimpleLink href="/browse">
          <ArrowBackIcon boxSize={5} mr={2} />
          Back to Explore
        </SimpleLink>
        <Flex
          direction="column"
          bgImage={`url('${collection.image}')`}
          bgSize="cover"
          bgPosition="center"
          mt={4}
          py={2}
          px={4}
          borderRadius="md"
          w="full"
          color="white"
        >
          <Box my={5}>
            <h2>
              <Text fontSize="sm" p={0}>
                doctype
              </Text>
              <Text fontSize="2xl" fontWeight="bold" p={0} m={0}>
                {facet}
              </Text>
            </h2>
          </Box>
          <Text fontSize="sm" fontWeight="normal">
            {kFormatNumber(
              countData?.[collection.facetField].buckets.find((db) => (db.val as string) === facetKey)?.count || 0,
            )}{' '}
            records
          </Text>
        </Flex>

        <Box as="section" w="full">
          <Heading as="h3" size="md" mb={2}>
            Sub-Collections
          </Heading>
          <Flex gap={4} width="full" flexWrap="wrap">
            {databaseFacets.map((d) => (
              <SubFacetCard
                key={`disc-${d.label}`}
                facet={d}
                recordCount={
                  databaseFacetCountData?.[explorerCollections.database.facetField].buckets.find(
                    (db) => db.val === d.facetKey,
                  )?.count || 0
                }
                selected={d.id === database}
                onSelect={handleSelectDatabase}
              />
            ))}
          </Flex>
        </Box>
        <FeaturedPapers query={searchQueryParams} />
        <Flex direction="column">
          <Heading as="h3" size="md" my={4}>
            {cid === 'doctype' ? `${facet} Over Time by Refereed Status` : 'Publication Over Time by Document Type'}
          </Heading>
          <OverTimeChart type={cid === 'doctype' ? 'refereed' : 'doctype'} query={searchQueryParams} />
        </Flex>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <Flex direction="column" flex={1}>
            <Heading as="h3" size="md" my={4}>
              Popular Journals in {facet}
            </Heading>
            <FacetFieldTable
              label="Popular Journals"
              query={searchQueryParams}
              facetField="pub"
              makeSearchLink={(facetVal) => makeJournalSearchLink(searchQueryParams, facetVal)}
            />
          </Flex>
          {cid === 'doctype' && (
            <Flex direction="column" flex={1}>
              <Heading as="h3" size="md" my={4}>
                Browse by Archive
              </Heading>
              <FacetFieldTable
                label="Archive"
                query={searchQueryParams}
                facetField="data_facet"
                makeSearchLink={(facetVal) => makeDataGroupSearchLink(searchQueryParams, facetVal)}
              />
            </Flex>
          )}
        </Flex>
      </Flex>
    );
  } else {
    return null;
  }
};
