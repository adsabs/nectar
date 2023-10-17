import {
  getSearchParams,
  IADSApiLibraryEntityResponse,
  IDocsEntity,
  SolrSort,
  useBigQuerySearch,
  useGetLibraryEntity,
} from '@api';
import { ChevronLeftIcon, LockIcon, SettingsIcon, UnlockIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from '@chakra-ui/react';
import {
  CustomInfoMessage,
  ItemsSkeleton,
  Pagination,
  SearchQueryLink,
  SimpleLink,
  SimpleResultList,
  Sort,
} from '@components';
import { BuildingLibraryIcon } from '@heroicons/react/24/solid';
import { AppState, useStore } from '@store';
import { NumPerPageType } from '@types';
import { parseAPIError } from '@utils';
import { memo, useEffect, useState } from 'react';

export interface ILibraryEntityPaneProps {
  library: IADSApiLibraryEntityResponse;
  publicView: boolean;
}

export const LibraryEntityPane = memo(({ library, publicView }: ILibraryEntityPaneProps) => {
  const pageSize = useStore((state: AppState) => state.numPerPage);

  const setPageSize = useStore((state: AppState) => state.setNumPerPage);

  const [docs, setDocs] = useState<IDocsEntity[]>([]);

  const [onPage, setOnPage] = useState(0);

  const [sort, setSort] = useState<SolrSort[]>(['date desc']);

  const {
    id,
    name,
    description,
    num_documents,
    public: isPublic,
    date_created,
    date_last_modified,
    owner,
  } = library.metadata;

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
    setOnPage(0);
    setPageSize(perPage);
  };

  return (
    <Container maxW="container.lg" mt={4}>
      <Box>
        {!publicView && (
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
        )}

        <Flex alignItems="center" gap={2}>
          {publicView ? (
            <IconButton
              icon={<BuildingLibraryIcon color="white" />}
              aria-label="SciX Public Library"
              isRound={true}
              colorScheme="gray"
              backgroundColor="gray.800"
              size="md"
              p={2}
              cursor="default"
              _hover={{ backgroundColor: 'gray.800' }}
            />
          ) : isPublic ? (
            <Tooltip label="This library is public">
              <UnlockIcon color="green.500" aria-label="public" />
            </Tooltip>
          ) : (
            <Tooltip label="This library is private">
              <LockIcon aria-label="private" />
            </Tooltip>
          )}
          <Heading variant="pageTitle" as="h1">
            {name}
          </Heading>
        </Flex>
        <Text my={2}>{description}</Text>
        <Table variant="unstyled" my={4} backgroundColor="gray.50">
          <Thead>
            <Tr>
              <Th>Papers</Th>
              {!publicView && <Th>Owner</Th>}
              <Th>Date Created</Th>
              <Th>Last Modified</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>
                Found {numFound} of {num_documents}
              </Td>
              {!publicView && <Td>{owner}</Td>}
              <Td>{new Date(date_created).toLocaleString()}</Td>
              <Td>{new Date(date_last_modified).toLocaleString()}</Td>
            </Tr>
          </Tbody>
        </Table>

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
              <ItemsSkeleton count={pageSize} />
            )}
          </Flex>
        )}
      </Box>
    </Container>
  );
});
