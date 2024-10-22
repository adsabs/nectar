import { ChevronLeftIcon, LockIcon, SettingsIcon, UnlockIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Icon,
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

import { biblibSortOptions } from '@/components/Sort/model';
import { BuildingLibraryIcon } from '@heroicons/react/24/solid';

import { AppState, useStore } from '@/store';
import { NumPerPageType } from '@/types';
import { uniq } from 'ramda';
import { useEffect, useMemo, useState } from 'react';
import { DocumentList } from './DocumentList/DocumentList';
import { SimpleLink } from '@/components/SimpleLink';
import { CustomInfoMessage, LoadingMessage } from '@/components/Feedbacks';
import { Sort } from '@/components/Sort';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { ItemsSkeleton, Pagination } from '@/components/ResultList';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { isBiblibSort, isSolrSort } from '@/utils/common/guards';
import { normalizeSolrSort } from '@/utils/common/search';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { LibraryIdentifier } from '@/api/biblib/types';
import { IDocsEntity } from '@/api/search/types';
import { BiblibSort, BiblibSortField } from '@/api/models';
import { useEditLibraryDocuments, useGetLibraryEntity } from '@/api/biblib/libraries';
import { useBigQuerySearch } from '@/api/search/search';
import { getSearchParams } from '@/api/search/models';

export interface ILibraryEntityPaneProps {
  id: LibraryIdentifier;
  publicView: boolean;
}

export const LibraryEntityPane = ({ id, publicView }: ILibraryEntityPaneProps) => {
  const pageSize = useStore((state: AppState) => state.numPerPage);

  const setPageSize = useStore((state: AppState) => state.setNumPerPage);

  const [docs, setDocs] = useState<IDocsEntity[]>([]);

  const [onPage, setOnPage] = useState(0);

  const [sort, setSort] = useState<BiblibSort>('time desc');

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
    data: library,
    isLoading: isLoadingLibs,
    error: errorFetchingLibs,
    refetch: refetchLibs,
  } = useGetLibraryEntity(
    {
      id,
    },
    { enabled: !!id, staleTime: 0 },
  );

  const {
    name,
    description,
    num_documents,
    public: isPublic,
    date_created,
    date_last_modified,
    owner,
  } = useMemo(() => library?.metadata, [library]);

  const { data: documents, refetch: refetchDocs } = useGetLibraryEntity(
    {
      id,
      start: onPage * pageSize,
      rows: pageSize,
      sort: [sort],
    },
    { cacheTime: 0, staleTime: 0 },
  );

  const colors = useColorModeColors();

  const { numFound } = library.solr.response;

  const canWrite = ['owner', 'admin', 'write'].includes(library?.metadata.permission);

  const { mutate: fetchDocuments, isLoading: isLoadingDocs, error: errorFetchingDocs } = useBigQuerySearch();

  useEffect(() => {
    if (documents?.documents) {
      fetchDocuments(
        {
          bibcodes: documents.documents,
          rows: pageSize,
          sort: isSolrSort(sort) ? normalizeSolrSort(sort) : ['date desc'], // if using biblib specific sort, default to date
        },
        {
          onSettled(data) {
            if (data) {
              // If using biblib exclusive sort, need to manually sort the results base on the sequence from library entity query
              // Biblib sorting is not available on big query here
              if (isBiblibSort(sort)) {
                const sorted = documents.documents.map((d) => data.docs.find((d1) => d === d1.bibcode));
                setDocs(sorted);
              } else {
                setDocs(data.docs);
              }
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

  const handleChangeSort = (sort: BiblibSort) => {
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
            void refetchLibs(); // update entity
            void refetchDocs(); // refresh doc list
          }
        },
      },
    );
  };

  return (
    <>
      {isLoadingLibs && (
        <Center>
          <LoadingMessage message="Loading library" />
        </Center>
      )}
      {errorFetchingLibs && (
        <CustomInfoMessage
          status={'error'}
          title={'Library not found'}
          description={
            <Text>
              Library does not exist.{' '}
              <SimpleLink href={'/user/libraries'} display="inline">
                View all libraries.
              </SimpleLink>
            </Text>
          }
        />
      )}
      {!isLoadingLibs && library && (
        <Box mt={4}>
          {!publicView && (
            <Flex justifyContent="space-between" my={4}>
              <SimpleLink href="/user/libraries">
                <Button variant="outline" leftIcon={<ChevronLeftIcon />} data-testid="lib-back-btn">
                  Back to libraries
                </Button>
              </SimpleLink>
              <SimpleLink href={`/user/libraries/${id}/settings`}>
                <IconButton
                  aria-label="settings"
                  icon={<SettingsIcon />}
                  variant="outline"
                  data-testid="settings-btn"
                />
              </SimpleLink>
            </Flex>
          )}

          <Flex alignItems="center" gap={2}>
            {publicView ? (
              <Icon
                as={BuildingLibraryIcon}
                aria-label="SciX Public Library"
                borderRadius={25}
                w={10}
                h={10}
                backgroundColor="gray.700"
                color="white"
                p={2}
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
            <Heading variant="pageTitle" as="h1" data-testid="lib-title">
              {name}
            </Heading>
          </Flex>
          <Text my={2} data-testid="lib-desc">
            {description}
          </Text>
          <Table
            variant="unstyled"
            my={4}
            backgroundColor={colors.panel}
            display={{ base: 'none', sm: 'block' }}
            data-testid="lib-meta"
          >
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
                <Sort<BiblibSort, BiblibSortField>
                  sort={sort}
                  onChange={handleChangeSort}
                  options={biblibSortOptions}
                  disableWhenNoJs
                />
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
                    library={id}
                    docs={docs}
                    notes={!publicView ? library.library_notes?.notes : undefined}
                    showNotes={!publicView}
                    canEdit={canWrite}
                    indexStart={onPage * pageSize}
                    onSet={handleSelectDoc}
                    hideCheckbox={!canWrite || publicView}
                    selectedBibcodes={selected}
                    hideResources={isMobile}
                    onNoteUpdate={refetchLibs}
                    useNormCite={sort.startsWith('citation_count_norm')}
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
      )}
    </>
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

  const { panel: PanelBackground } = useColorModeColors();

  return (
    <Flex justifyContent="space-between" backgroundColor={PanelBackground} p={4}>
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
            data-testid="select-all-checkbox"
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
      <Button
        isDisabled={selectedCount === 0}
        colorScheme="red"
        onClick={onDeleteSelected}
        data-testid="del-selected-btn"
      >
        Delete
      </Button>
    </Flex>
  );
};
