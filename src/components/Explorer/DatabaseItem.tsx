import { SimpleLink } from '@/components/SimpleLink';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { IExplorerFacet } from './types';
import { databases, explorerCollections, explorerFacets } from './data';
import { useGetSearchFacetJSON } from '@/api/search/search';
import { getSearchFacetParams } from '../SearchFacet/useGetFacetData';
import { allRecordsQuery, makeBibgroupSearchLink, makeJournalSearchLink, searchFacetDefaultParams } from './helpers';
import { kFormatNumber } from '@/utils/common/formatters';
import { IADSApiSearchParams } from '@/api/search/types';
import { useEffect, useState } from 'react';
import { FeaturedPapers } from './FeaturedPapers';
import { FacetFieldTable } from './FacetFieldTable';
import { SubFacetCard, SubFacetSimpleCard } from './SubFacetCard';
import { OverTimeChart } from './OverTimeChart';

const cid = 'database';

export const DatabaseItem = ({ facetValue }: { facetValue: IExplorerFacet['searchQueryValue'] }) => {
  const collection = explorerCollections[cid];

  const facet = explorerFacets[cid].find((f) => f.facetKey === facetValue); // i.e. astronomy

  const subFacets = facet.subset?.map((f) => databases[f]);

  const [subFacetDatabase, setSubFacetDatabase] = useState<IExplorerFacet>(null); // optional, i.e astrophysics

  const [subFacetDoctype, setSubFacetDoctype] = useState<IExplorerFacet>(null);

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
    const newQuery = `${collection.searchQueryField}:"${
      subFacetDatabase ? subFacetDatabase.searchQueryValue : facet.searchQueryValue
    }"`;

    setQuery(`${newQuery}${subFacetDoctype ? ` doctype:"${subFacetDoctype.searchQueryValue}"` : ''}`);
  }, [subFacetDatabase, subFacetDoctype]);

  const handleSelectSubset = (selected: IExplorerFacet['id']) => {
    if (subFacetDatabase?.id === selected) {
      setSubFacetDatabase(null);
    } else {
      setSubFacetDatabase(subFacets.find((d) => d.id === selected));
    }
  };

  const handleSelectDoctype = (selected: IExplorerFacet['id']) => {
    if (subFacetDoctype?.id === selected) {
      setSubFacetDoctype(null);
    } else {
      setSubFacetDoctype(explorerFacets.doctype.find((d) => d.id === selected));
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
                {collection.label}
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
                  selected={d.id === subFacetDatabase?.id}
                  onSelect={handleSelectSubset}
                />
              ))}
            </Flex>
          </Box>
        )}
        <Box as="section" w="full">
          <Heading as="h3" size="md" mb={2}>
            Document Types
          </Heading>
          <Flex gap={4} width="full" flexWrap="wrap">
            {explorerFacets.doctype.map((d) => (
              <SubFacetSimpleCard
                key={`doctype-${d.label}`}
                facet={d}
                selected={d.id === subFacetDoctype?.id}
                onSelect={handleSelectDoctype}
              />
            ))}
          </Flex>
        </Box>
        <FeaturedPapers query={{ q: query }} />
        <Flex direction="column">
          <Heading as="h3" size="md" my={4}>
            Publication Over Time by Document Type
          </Heading>
          <OverTimeChart type="doctype" query={{ q: query }} />
        </Flex>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <Flex direction="column" flex={1}>
            <Heading as="h3" size="md" my={4}>
              Popular Publications in {facet.label}
            </Heading>
            <FacetFieldTable
              label="Popular Publications"
              query={{ q: query }}
              facetField="pub"
              makeSearchLink={(facetVal) => makeJournalSearchLink({ q: query }, facetVal)}
            />
          </Flex>
          <Flex direction="column" flex={1}>
            <Heading as="h3" size="md" my={4}>
              Curated Collections
            </Heading>
            <FacetFieldTable
              label="Curated Collections"
              query={{ q: query }}
              facetField="bibgroup_facet"
              makeSearchLink={(facetVal) => makeBibgroupSearchLink({ q: query }, facetVal)}
            />
          </Flex>
        </Flex>
      </Flex>
    );
  } else {
    return null;
  }
};
