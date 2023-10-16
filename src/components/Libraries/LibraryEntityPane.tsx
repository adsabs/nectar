import {
  getSearchParams,
  IADSApiLibraryEntityResponse,
  IDocsEntity,
  SolrSort,
  useBigQuerySearch,
  useGetLibraryEntity,
} from '@api';
import { ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from '@chakra-ui/icons';
import { Box, Button, Container, Flex, Heading, IconButton, Text } from '@chakra-ui/react';
import {
  CustomInfoMessage,
  ItemsSkeleton,
  Pagination,
  SearchQueryLink,
  SimpleLink,
  SimpleResultList,
  Sort,
} from '@components';
import { NumPerPageType } from '@types';
import { parseAPIError } from '@utils';
import { memo, useEffect, useState } from 'react';

export interface ILibraryEntityPaneProps {
  library: IADSApiLibraryEntityResponse;
}
export const LibraryEntityPane = memo(({ library }: ILibraryEntityPaneProps) => {
  const [docs, setDocs] = useState<IDocsEntity[]>([]);

  const [onPage, setOnPage] = useState(0);

  const [pageSize, setPageSize] = useState<NumPerPageType>(10);

  const [sort, setSort] = useState<SolrSort[]>(['date desc']);

  const { id, name, description, num_documents } = library.metadata;

  const { numFound } = library.solr.response;

  const { data: documents, isLoading: isLoadingDocs } = useGetLibraryEntity({
    id,
    start: onPage * pageSize,
    rows: pageSize,
    sort: sort,
  });

  const { mutate: fetchDocuments, isLoading: isFetchingDocs } = useBigQuerySearch();

  useEffect(() => {
    if (documents?.documents) {
      fetchDocuments(
        { bibcodes: documents.documents, rows: pageSize },
        {
          onSettled(data, error) {
            if (data) {
              setDocs(data.docs);
            } else if (error) {
              console.log(parseAPIError(error));
            }
          },
        },
      );
    }
  }, [documents?.documents]);

  const handleNextPage = () => {
    setOnPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    setOnPage((prev) => prev - 1);
  };

  const handlePageSelect = (page: number) => {
    setOnPage(page);
  };

  const handlePerPageSelect = (perPage: NumPerPageType) => {
    setPageSize(perPage);
  };

  return (
    <Container maxW="container.lg" mt={4}>
      <Box>
        <Flex justifyContent="space-between" my={4}>
          <SimpleLink href="/user/libraries">
            <Button variant="outline" leftIcon={<ChevronLeftIcon />}>
              Back to libraries
            </Button>
          </SimpleLink>
          <SimpleLink href={`/user/libraries/${id}/settings`}>
            <IconButton aria-label="settings" icon={<SettingsIcon />} variant="outline" />
          </SimpleLink>
        </Flex>

        <Heading variant="pageTitle" as="h1">
          {name}
        </Heading>

        <Text fontSize="sm" color="gray.400">
          Found {numFound} of {num_documents} articles in the library
        </Text>
        <Text my={2}>{description}</Text>

        {num_documents === 0 && <CustomInfoMessage status="info" title="Library is empty" />}

        {num_documents > 0 && numFound === 0 && <CustomInfoMessage status="info" title="Found 0 articles" />}

        {library.solr.response.numFound > 0 && (
          <Flex direction="column" gap={2}>
            <Flex
              justifyContent="space-between"
              alignItems="end"
              style={isLoadingDocs || isFetchingDocs ? { pointerEvents: 'none' } : { pointerEvents: 'auto' }}
            >
              <Sort sort={sort} onChange={setSort} />
              <SearchQueryLink params={{ ...getSearchParams, q: `docs(library/${id})` }}>
                View as search results
              </SearchQueryLink>
            </Flex>

            {!isLoadingDocs && !isFetchingDocs ? (
              <>
                <SimpleResultList docs={docs} hideCheckboxes indexStart={onPage * pageSize} />
                <Pagination
                  totalResults={numFound}
                  page={onPage + 1}
                  numPerPage={pageSize}
                  onNext={handleNextPage}
                  onPrevious={handlePrevPage}
                  onPageSelect={handlePageSelect}
                  onPerPageSelect={handlePerPageSelect}
                  skipRouting
                />
              </>
            ) : (
              <ItemsSkeleton count={10} />
            )}
          </Flex>
        )}
      </Box>
    </Container>
  );
});
