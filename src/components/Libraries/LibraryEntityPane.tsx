import {
  getSearchParams,
  IADSApiLibraryEntityResponse,
  IDocsEntity,
  SolrSort,
  useBigQuerySearch,
  useEditLibraryDocuments,
  useGetLibraryEntity,
} from '@api';
import { ChevronLeftIcon, LockIcon, SettingsIcon, UnlockIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpoint,
  useToast,
} from '@chakra-ui/react';
import { CustomInfoMessage, ItemsSkeleton, Pagination, SearchQueryLink, SimpleLink, Sort } from '@components';
import { BuildingLibraryIcon } from '@heroicons/react/24/solid';
import { AppState, useStore } from '@store';
import { NumPerPageType } from '@types';
import { noop, parseAPIError } from '@utils';
import { uniq } from 'ramda';
import { memo, useEffect, useMemo, useState } from 'react';
import { DocumentList } from './DocumentList/DocumentList';

export interface ILibraryEntityPaneProps {
  library: IADSApiLibraryEntityResponse;
  publicView: boolean;
  onRefetch?: () => void;
}

export const LibraryEntityPane = ({ library, publicView, onRefetch = noop }: ILibraryEntityPaneProps) => {
  const pageSize = useStore((state: AppState) => state.numPerPage);

  const setPageSize = useStore((state: AppState) => state.setNumPerPage);

  const [docs, setDocs] = useState<IDocsEntity[]>([]);

  const [onPage, setOnPage] = useState(0);

  const [sort, setSort] = useState<SolrSort[]>(['date desc']);

  const [selected, setSelected] = useState<string[]>([]);

  // bibcodes on current page
  const currentBibcodes = useMemo(() => docs.map((d) => d.bibcode), [docs]);

  const isAllSelected = useMemo(
    () => (currentBibcodes.length === 0 ? false : currentBibcodes.every((b) => selected.includes(b))),
    [currentBibcodes, selected],
  );

  const isSomeSelected = useMemo(
    () => (currentBibcodes.length === 0 ? false : currentBibcodes.some((b) => selected.includes(b))),
    [currentBibcodes, selected],
  );

  const breakpoint = useBreakpoint();

  const isMobile = ['base', 'xs', 'sm'].includes(breakpoint, 0);

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

  const { data: documents } = useGetLibraryEntity(
    {
      id,
      start: onPage * pageSize,
      rows: pageSize,
      sort: sort,
    },
    { cacheTime: 0, staleTime: 0 },
  );

  const { numFound } = library.solr.response;

  const canWrite = ['owner', 'admin', 'write'].includes(library?.metadata.permission);

  const { mutate: fetchDocuments, isLoading: isLoadingDocs, error: errorFetchingDocs } = useBigQuerySearch();

  useEffect(() => {
    if (documents?.documents) {
      fetchDocuments(
        { bibcodes: documents.documents, rows: pageSize },
        {
          onSettled(data) {
            if (data) {
              setDocs(data.docs);
            }
          },
        },
      );
    }
  }, [documents?.documents]);

  const { mutate: editLibraryDocuments } = useEditLibraryDocuments();

  const toast = useToast({
    duration: 2000,
  });

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

  const handleChangeSort = (sort: SolrSort[]) => {
    setSort(sort);
  };

  const handleSelectDoc = (bibcode: string, checked: boolean) => {
    if (checked && !selected.includes(bibcode)) {
      setSelected((prev) => [...prev, bibcode]);
    } else if (!checked) {
      setSelected((prev) => prev.filter((b) => b !== bibcode));
    }
  };

  const handleSelectAllCurrent = () => {
    setSelected((prev) => uniq([...prev, ...currentBibcodes]));
  };

  const handleClearAllCurrent = () => {
    setSelected((prev) => prev.filter((b) => !currentBibcodes.includes(b)));
  };

  const handleClearAll = () => {
    setSelected([]);
  };

  const handleDeleteFromLibrary = () => {
    editLibraryDocuments(
      { id, bibcode: selected, action: 'remove' },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error removing papers from library',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: `${data.number_removed} papers removed from library`,
            });

            // reset
            setOnPage(0);
            setSelected([]);
            onRefetch();
          }
        },
      },
    );
  };

  return (
    <Box mt={4}>
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
      <Table variant="unstyled" my={4} backgroundColor="gray.50" display={{ base: 'none', sm: 'block' }}>
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

      {errorFetchingDocs && (
        <CustomInfoMessage
          status="error"
          title="Error loading documents"
          description={parseAPIError(errorFetchingDocs)}
        />
      )}

      {numFound > 0 && !errorFetchingDocs && (
        <Flex direction="column" gap={2}>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justifyContent={{ base: 'start', sm: 'space-between' }}
            alignItems={{ base: 'start', sm: 'end' }}
            style={isLoadingDocs ? { pointerEvents: 'none' } : { pointerEvents: 'auto' }}
          >
            <Sort sort={sort} onChange={handleChangeSort} />
            <SearchQueryLink params={{ ...getSearchParams, q: `docs(library/${id})` }}>
              View as search results
            </SearchQueryLink>
          </Flex>

          {canWrite && !publicView && (
            <Box style={isLoadingDocs ? { pointerEvents: 'none' } : { pointerEvents: 'auto' }} w="full">
              <BulkAction
                isAllSelected={isAllSelected}
                isSomeSelected={isSomeSelected}
                onSelectAllCurrent={handleSelectAllCurrent}
                onClearAllCurrent={handleClearAllCurrent}
                onClearAll={handleClearAll}
                selectedCount={selected.length}
                onDeleteSelected={handleDeleteFromLibrary}
              />
            </Box>
          )}

          {!isLoadingDocs ? (
            <>
              <DocumentList
                docs={docs}
                indexStart={onPage * pageSize}
                onSet={handleSelectDoc}
                hideCheckbox={!canWrite || publicView}
                selectedBibcodes={selected}
                hideResources={isMobile}
              />
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
  );
};

const BulkAction = ({
  isAllSelected,
  isSomeSelected,
  onSelectAllCurrent,
  onClearAllCurrent,
  onClearAll,
  selectedCount,
  onDeleteSelected,
}: {
  isAllSelected: boolean;
  isSomeSelected: boolean;
  selectedCount: number;
  onSelectAllCurrent: () => void;
  onClearAllCurrent: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
}) => {
  const handleChange = () => {
    isAllSelected || isSomeSelected ? onClearAllCurrent() : onSelectAllCurrent();
  };

  return (
    <Flex justifyContent="space-between" backgroundColor="gray.50" p={4}>
      <HStack gap={2}>
        <Tooltip
          label={
            isAllSelected || isSomeSelected ? 'clear selected papers on this page' : 'select all papers on this page'
          }
        >
          <Checkbox
            size="md"
            isChecked={isAllSelected}
            isIndeterminate={!isAllSelected && isSomeSelected}
            onChange={handleChange}
            mr={2}
          />
        </Tooltip>
        {selectedCount > 0 && (
          <>
            <>{selectedCount} selected</>
            <Button variant="link" onClick={onClearAll}>
              Clear All
            </Button>
          </>
        )}
      </HStack>
      <Button isDisabled={selectedCount === 0} colorScheme="red" onClick={onDeleteSelected}>
        Delete
      </Button>
    </Flex>
  );
};
