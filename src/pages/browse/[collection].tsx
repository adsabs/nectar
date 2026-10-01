import { useGetSearchFacetJSON } from '@/api/search/search';
import { bibgroupDetails } from '@/components/Explorer/bibgroup_data';
import { explorerCollections } from '@/components/Explorer/data';
import { dataDetails } from '@/components/Explorer/data_data';
import { doctypeDetails } from '@/components/Explorer/doctype_data';
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
import { ArrowBackIcon, CloseIcon } from '@chakra-ui/icons';
import {
  CardBody,
  Flex,
  Heading,
  Text,
  Card,
  Container,
  Skeleton,
  Box,
  Center,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';

import { useRouter } from 'next/router';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/lib/useDebounce';
import { ControlledPaginationControls } from '@/components/Pagination/ControlledPaginationControls';
import { NumPerPageType } from '@/types';

const CollectionPage: NextPage = () => {
  const router = useRouter();

  const collection = router.query.collection as string;

  const colors = useColorModeColors();

  const [pageIndex, setPageIndex] = useState(0);

  const [pageSize, setPageSize] = useState<number>(25);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  // fetch collection (facet) data
  const { data, isError, isLoading, error } = useGetSearchFacetJSON(searchParams, {
    enabled: collection && isExplorerCollection(collection),
  });

  const getFacetValue = (val: string) => {
    const regex = /^[01]\/(.*)/;
    return regex.test(val) ? parseTitleFromKey(val) : val;
  };

  // clean up collection data
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

  const facetDetails = useMemo(() => {
    return collection === 'doctype'
      ? doctypeDetails
      : collection === 'bibgroup'
      ? bibgroupDetails
      : collection === 'data'
      ? dataDetails
      : {};
  }, [collection]);

  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) {
      return collectionData;
    }
    return collectionData.filter((d) => {
      const facetKey = getFacetValue(d.val as string).toLowerCase();
      const search = debouncedSearchTerm.toLowerCase();
      const desc = facetDetails[d.val as string]?.title?.toLowerCase();
      return facetKey.includes(search) || desc?.includes(search);
    });
  }, [collectionData, debouncedSearchTerm, facetDetails]);

  const pageData = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearchTerm]);

  const onChangePageIndex = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const onChangePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

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
        <InputGroup>
          <Input
            placeholder={`Search within ${explorerCollections[collection].label}`}
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
          />
          <InputRightElement>
            <IconButton
              aria-label="clear search"
              icon={<CloseIcon />}
              size="sm"
              onClick={() => setSearchTerm('')}
              visibility={searchTerm ? 'visible' : 'hidden'}
              variant="ghost"
            />
          </InputRightElement>
        </InputGroup>
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
              {pageData.map((facetKey) => (
                <Card
                  key={`recordType-${facetKey.val}`}
                  minW={280}
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
                        as={facetDetails[facetKey.val as string]?.icon}
                        boxSize={12}
                        mr={4}
                        flexShrink={0}
                        aria-hidden
                      />
                      <Flex direction="column">
                        <Text fontSize="lg" fontWeight="bold">
                          {getFacetValue(facetKey.val as string)}
                        </Text>
                        {facetDetails[facetKey.val as string]?.title && (
                          <Text fontSize="sm" color={colors.lightText}>
                            {facetDetails[facetKey.val as string].title}
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
        <ControlledPaginationControls
          entries={filteredData.length}
          pageIndex={pageIndex}
          pageSize={pageSize as NumPerPageType}
          onChangePageSize={onChangePageSize}
          onChangePageIndex={onChangePageIndex}
          py={4}
        />
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
