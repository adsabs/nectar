import { SimpleLink } from '@/components/SimpleLink';
import { Box, Flex, Heading, HStack, Text } from '@chakra-ui/react';
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
import { SubFacetCard } from './SubFacetCard';
import { IExplorerCollection } from './types';
import { OverTimeChart } from './OverTimeChart';
import { doctypeDetails, doctypeSearchParamsMap } from './doctype_data';
import { dataDetails } from './data_data';
import { bibgroupDetails } from './bibgroup_data';

const databaseFacetIds = ['astrophysics', 'heliophysics', 'planetary', 'earthscience'];

export const FacetItem = ({ cid, facetKey }: { cid: IExplorerCollection['id']; facetKey: string }) => {
  const collection = explorerCollections[cid];

  const regex = /^[01]\/(.*)/;

  const facet = regex.test(facetKey) ? parseTitleFromKey(facetKey) : facetKey;

  const databaseFacets = databaseFacetIds.map((id) => databases[id]);

  const [database, setDatabase] = useState<(typeof databaseFacetIds)[number] | null>(null);

  const facetDetails = useMemo(() => {
    return collection.id === 'doctype'
      ? doctypeDetails
      : collection.id === 'bibgroup'
      ? bibgroupDetails
      : collection.id === 'data'
      ? dataDetails
      : {};
  }, [collection]);

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
    const q =
      collection.id === 'doctype'
        ? doctypeSearchParamsMap[facetKey].map((dt) => `${collection.searchQueryField}:"${dt}"`).join(' OR ')
        : `${collection.searchQueryField}:"${facetKey}"`;

    //  Optional database filter
    {
      return database
        ? (applyFiltersToQuery({
            query: { q } as IADSApiSearchParams,
            values: [database],
            field: 'database',
            logic: 'or',
          }) as IADSApiSearchParams)
        : ({ q } as IADSApiSearchParams);
    }
  }, [collection, facetKey, database]);

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
        <HStack>
          <SimpleLink href="/browse">Explore</SimpleLink>
          <>{' > '}</>
          <SimpleLink href={`/browse/${collection.id}`}>{collection.label}</SimpleLink>
        </HStack>
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
              <Text fontSize="2xl" fontWeight="bold" p={0} m={0}>
                {facet}
              </Text>
            </h2>
            <Text fontWeight="semibold">{facetDetails[facetKey]?.title}</Text>
            <Text fontSize="sm" width="30%" my={2}>
              {facetDetails[facetKey]?.desc}
            </Text>
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
              Popular Publications in {facet}
            </Heading>
            <FacetFieldTable
              label="Popular Publications"
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
