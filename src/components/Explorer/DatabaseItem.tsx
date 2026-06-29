import { SimpleLink } from '@/components/SimpleLink';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { IExplorerFacet } from './types';
import { databases, explorerCollections, explorerFacets } from './data';
import { useGetSearchFacetJSON } from '@/api/search/search';
import { getSearchFacetParams } from '../SearchFacet/useGetFacetData';
import { allRecordsQuery, searchFacetDefaultParams } from './helpers';
import { kFormatNumber } from '@/utils/common/formatters';
import { IADSApiSearchParams } from '@/api/search/types';
import { useEffect, useState } from 'react';
import { FeaturedPapers } from './FeaturedPapers';
import { JournalsTable } from './JournalsTable';
import { SubFacetCard } from './SubFacetCard';
import { OverTimeChart } from './OverTimeChart';

const cid = 'database';

export const DatabaseItem = ({ facetValue }: { facetValue: IExplorerFacet['searchQueryValue'] }) => {
  const collection = explorerCollections[cid];

  const facet = explorerFacets[cid].find((f) => f.facetKey === facetValue); // i.e. astronomy

  const subFacets = facet.subset?.map((f) => databases[f]);

  const [subFacet, setSubFacet] = useState<IExplorerFacet>(null); // optional, i.e astrophysics

  // The main query (q) for the page (i.e. database:astrophysics)
  const [query, setQuery] = useState<IADSApiSearchParams['q']>(
    `${collection.searchQueryField}:"${facet.searchQueryValue}"`,
  );

  // database count
  const { data: countData } = useGetSearchFacetJSON({
    ...allRecordsQuery,
    filter: [],
    field: explorerCollections[cid].facetSearchParams.field,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      ...explorerCollections[cid].facetSearchParams,
    }),
  });

  // apply sub-facet
  useEffect(() => {
    setQuery(`${collection.searchQueryField}:"${subFacet ? subFacet.searchQueryValue : facet.searchQueryValue}"`);
  }, [subFacet]);

  const handleSelectSubset = (selected: IExplorerFacet['id']) => {
    if (subFacet?.id === selected) {
      setSubFacet(null);
    } else {
      setSubFacet(subFacets.find((d) => d.id === selected));
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
          bgImage={`url('${facet.image}')`}
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
                discipline
              </Text>
              <Text fontSize="2xl" fontWeight="bold" p={0} m={0}>
                {facet.label}
              </Text>
            </h2>
          </Box>
          <Text fontSize="sm" fontWeight="normal">
            {kFormatNumber(
              countData?.[collection.facetField].buckets.find((db) => db.val === facet.facetKey)?.count || 0,
            )}{' '}
            records
          </Text>
        </Flex>
        {facet.subset.length > 0 && (
          <Box as="section" w="full">
            <Heading as="h3" size="md" mb={2}>
              Sub-Collections
            </Heading>
            <Flex gap={4} width="full" flexWrap="wrap">
              {subFacets.map((d) => (
                <SubFacetCard
                  key={`disc-${d.label}`}
                  facet={d}
                  recordCount={
                    countData?.[collection.facetField].buckets.find((db) => db.val === d.facetKey)?.count || 0
                  }
                  selected={d.id === subFacet?.id}
                  onSelect={handleSelectSubset}
                />
              ))}
            </Flex>
          </Box>
        )}
        <FeaturedPapers query={{ q: query }} />
        <Flex direction="column">
          <Heading as="h3" size="md" my={4}>
            Publication Over Time by Document Type
          </Heading>
          <OverTimeChart type="doctype" query={{ q: query }} />
        </Flex>
        <Flex direction="column">
          <Heading as="h3" size="md" my={4}>
            Popular Journals in {facet.label}
          </Heading>
          <JournalsTable query={{ q: query }} />
        </Flex>
      </Flex>
    );
  } else {
    return null;
  }
};
