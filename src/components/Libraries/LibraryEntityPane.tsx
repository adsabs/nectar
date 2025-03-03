import { ChevronDownIcon, ChevronLeftIcon, LockIcon, SettingsIcon, UnlockIcon } from '@chakra-ui/icons';
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
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuGroupProps,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpoint,
  useClipboard,
  useToast,
} from '@chakra-ui/react';

import { biblibSortOptions } from '@/components/Sort/model';
import { BuildingLibraryIcon, ShareIcon } from '@heroicons/react/24/solid';

import { AppState, useStore } from '@/store';
import { NumPerPageType } from '@/types';
import { curryN, uniq, values } from 'ramda';
import { ReactElement, useEffect, useMemo, useState } from 'react';
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
import { Bibcode, IDocsEntity } from '@/api/search/types';
import { BiblibSort, BiblibSortField } from '@/api/models';
import { useEditLibraryDocuments, useGetLibraryEntity } from '@/api/biblib/libraries';
import { useBigQuerySearch } from '@/api/search/search';
import { getSearchParams } from '@/api/search/models';
import { useSettings } from '@/lib/useSettings';
import { ExportApiFormatKey } from '@/api/export/types';
import { useVaultBigQuerySearch } from '@/api/vault/vault';
import { useRouter } from 'next/router';
import { exportFormats } from '../CitationExporter';

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

  const { hasCopied, onCopy, setValue, value } = useClipboard('');

  useEffect(() => {
    if (library?.metadata?.id) {
      setValue(`${process.env.NEXT_PUBLIC_BASE_CANONICAL_URL}/public-libraries/${library.metadata.id}`);
    }
  }, [library, setValue]);

  const handleCopyPublicURL = () => {
    if (value !== '') {
      onCopy();
    }
  };

  useEffect(() => {
    if (hasCopied) {
      toast({ status: 'info', title: 'Copied to Clipboard' });
    }
  }, [hasCopied, toast]);

  return (
    <>
      {isLoadingLibs && (
        <Center>
          <LoadingMessage message="Loading library" />
        </Center>
      )}
      {!isLoadingLibs && errorFetchingLibs && (
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
              <HStack>
                {isPublic && (
                  <Tooltip label="View as public library">
                    <SimpleLink href={`/public-libraries/${library.metadata.id}`}>
                      <IconButton
                        aria-label="view as public library"
                        icon={<BuildingLibraryIcon width="20px" height="20px" />}
                        variant="outline"
                      />
                    </SimpleLink>
                  </Tooltip>
                )}
                <SimpleLink href={`/user/libraries/${id}/settings`}>
                  <IconButton
                    aria-label="settings"
                    icon={<SettingsIcon />}
                    variant="outline"
                    data-testid="settings-btn"
                  />
                </SimpleLink>
              </HStack>
            </Flex>
          )}

          <Flex justifyContent="space-between">
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
            {publicView && isPublic && (
              <Tooltip label="Copy public library link">
                <IconButton
                  aria-label="copy public library link"
                  icon={<ShareIcon width="18px" height="18px" />}
                  variant="outline"
                  cursor="pointer"
                  onClick={handleCopyPublicURL}
                />
              </Tooltip>
            )}
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

              {canWrite && !publicView && !isLoadingDocs && (
                <Box style={isLoadingDocs ? { pointerEvents: 'none' } : { pointerEvents: 'auto' }} w="full">
                  <BulkMenu
                    library={id}
                    isAllSelected={isAllSelected}
                    isSomeSelected={isSomeSelected}
                    onSelectAllCurrent={handleSelectAllCurrent}
                    onClearAllCurrent={handleClearAllCurrent}
                    onClearAll={handleClearAll}
                    selectedDocs={selected}
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

const BulkMenu = ({
  library,
  isAllSelected,
  isSomeSelected,
  onSelectAllCurrent,
  onClearAllCurrent,
  onClearAll,
  selectedDocs,
  onDeleteSelected,
}: {
  library: string;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  selectedDocs: string[];
  onSelectAllCurrent: () => void;
  onClearAllCurrent: () => void;
  onClearAll: () => void;
  onDeleteSelected: () => void;
}) => {
  const { settings } = useSettings();

  const { panel: PanelBackground } = useColorModeColors();

  const [applyToAll, setApplyToAll] = useState(selectedDocs.length === 0);

  useEffect(() => {
    setApplyToAll(selectedDocs.length === 0);
  }, [selectedDocs]);

  const handleChange = () => {
    isAllSelected || isSomeSelected ? onClearAllCurrent() : onSelectAllCurrent();
  };

  const handleApplyOption = (value: string | string[]) => {
    if (typeof value === 'string') {
      setApplyToAll(value === 'all');
    }
  };

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
        {selectedDocs.length > 0 && (
          <>
            <>{selectedDocs.length} selected</>
            <Button variant="link" onClick={onClearAll}>
              Clear All
            </Button>
          </>
        )}
      </HStack>
      <Stack direction="row" order={{ base: '1', md: '2' }} wrap="wrap">
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
            Export
          </MenuButton>
          <Portal>
            <MenuList>
              <MenuOptionGroup value={applyToAll ? 'all' : 'selected'} type="radio" onChange={handleApplyOption}>
                <MenuItemOption value="all" closeOnSelect={false}>
                  All
                </MenuItemOption>
                <MenuItemOption value="selected" isDisabled={selectedDocs.length === 0} closeOnSelect={false}>
                  Selected
                </MenuItemOption>
              </MenuOptionGroup>
              <MenuDivider />
              {applyToAll ? (
                <ExportMenu library={library} defaultExportFormat={settings.defaultExportFormat} />
              ) : (
                <ExportMenu library={library} docs={selectedDocs} defaultExportFormat={settings.defaultExportFormat} />
              )}
            </MenuList>
          </Portal>
        </Menu>
        <Button
          isDisabled={selectedDocs.length === 0}
          colorScheme="red"
          onClick={onDeleteSelected}
          data-testid="del-selected-btn"
        >
          Delete
        </Button>
      </Stack>
    </Flex>
  );
};

const ExportMenu = (
  props: MenuGroupProps & { docs?: string[]; library: string; defaultExportFormat: string },
): ReactElement => {
  const { docs, library, defaultExportFormat, ...menuGroupProps } = props;
  const router = useRouter();
  const [selected, setSelected] = useState<Bibcode[]>(null);
  const [route, setRoute] = useState(['', '']);

  const { data } = useVaultBigQuerySearch(selected ?? [], { enabled: !!selected && selected.length > 0 });

  const defaultExportFormatValue = values(exportFormats).find((f) => f.label === defaultExportFormat).value;

  useEffect(() => {
    // when vault query is done, transition to the export page passing only qid
    if (data) {
      setSelected([]);
      void router.push(
        {
          pathname: route[0],
          query: { q: `docs(library/${library}`, qid: data.qid, referrer: `/user/libraries/${library}` },
        },
        {
          pathname: route[1],
          query: { q: `docs(library/${library}`, qid: data.qid, referrer: `/user/libraries/${library}` },
        },
      );
    }
  }, [data]);

  // on route change
  useEffect(() => {
    if (route[0] !== '' && route[1] !== '') {
      if (docs && docs.length > 0) {
        // do this to trigger query request
        return setSelected(docs);
      } else {
        // if explore all, then just use the current query, and do not trigger vault (redirect immediately)
        void router.push(
          { pathname: route[0], query: { q: `docs(library/${library})`, referrer: `/user/libraries/${library}` } },
          { pathname: route[1], query: { q: `docs(library/${library})`, referrer: `/user/libraries/${library}` } },
        );
      }
    }
  }, [route]);

  const handleExportItemClick = curryN(2, (format: ExportApiFormatKey) => {
    setRoute([`/search/exportcitation/[format]`, `/search/exportcitation/${format}`]);
  });

  return (
    <MenuGroup {...menuGroupProps} title="EXPORT">
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.bibtex)}>in BibTeX</MenuItem>
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.aastex)}>in AASTeX</MenuItem>
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.endnote)}>in EndNote</MenuItem>
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.ris)}>in RIS</MenuItem>
      <MenuItem onClick={handleExportItemClick(defaultExportFormatValue as ExportApiFormatKey)}>Other Formats</MenuItem>
    </MenuGroup>
  );
};
