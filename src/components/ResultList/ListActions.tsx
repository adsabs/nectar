import { BellIcon, ChevronDownIcon, SettingsIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Flex,
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
  Switch,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  VisuallyHidden,
} from '@chakra-ui/react';

import { useIsClient } from '@/lib/useIsClient';
import { AppState, useStore, useStoreApi } from '@/store';
import { useRouter } from 'next/router';
import { curryN, values } from 'ramda';
import { isNonEmptyString } from 'ramda-adjunct';
import { MouseEventHandler, ReactElement, useCallback, useEffect, useState } from 'react';
import { SecondOrderOpsLinks } from './SecondOrderOpsLinks';
import { BulkClaimMenuItem, BulkDeleteMenuItem } from '@/components/Orcid';
import { useOrcid } from '@/lib/orcid/useOrcid';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';

import { AddNotificationModal } from '@/components/EmailNotifications/AddNotificationModal';
import { solrSortOptions } from '@/components/Sort/model';
import { ISortProps, Sort } from '@/components/Sort';
import { sections } from '@/components/Visualizations';
import { exportFormats } from '@/components/CitationExporter';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import { noop } from '@/utils/common/noop';
import { SolrSort, SolrSortField } from '@/api/models';
import { useVaultBigQuerySearch } from '@/api/vault/vault';
import { Bibcode } from '@/api/search/types';
import { ExportApiFormatKey } from '@/api/export/types';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export interface IListActionsProps {
  onSortChange?: ISortProps<SolrSort, SolrSortField>['onChange'];
  onOpenAddToLibrary: () => void;
  isLoading: boolean;
}

type Operator = 'trending' | 'reviews' | 'useful' | 'similar';

export const ListActions = (props: IListActionsProps): ReactElement => {
  const { onSortChange = noop, onOpenAddToLibrary, isLoading } = props;
  const selected = useStore((state) => state.docs.selected ?? []);
  const clearSelected = useStore((state) => state.clearSelected);
  const isClient = useIsClient();
  const { isAuthenticated } = useSession();
  const noneSelected = selected.length === 0;
  const [exploreAll, setExploreAll] = useState(true);
  const router = useRouter();
  const toast = useToast();

  const { settings } = useSettings({ suspense: false });

  const {
    isOpen: isCreateNotificationOpen,
    onOpen: onCreateNotificationOpen,
    onClose: onCreateNotificationClose,
  } = useDisclosure();

  useEffect(() => {
    setExploreAll(noneSelected);
  }, [noneSelected]);

  const [path, setPath] = useState<{ path?: string; operator?: Operator }>(null);
  const { data, error } = useVaultBigQuerySearch(selected, { enabled: !!path });

  useEffect(() => {
    // if data exists, push our qid to the route and change pages
    if (data && path) {
      if (path.path) {
        // go to viz page with original query
        void router.push({ pathname: path.path, query: { ...router.query, qid: data.qid } });
      } else {
        // new search with operator
        const q = createOperatorQuery(path.operator, `docs(${data.qid})`);
        void router.push({ pathname: '', search: makeSearchParams({ q, sort: ['score desc'] }) });
      }
      clearSelected();
      setPath(null);
    }

    if (error) {
      toast({
        status: 'error',
        title: 'Error!',
        description: 'Error fetching selected papers',
      });
      setPath(null);
    }
  }, [data, error, path]);

  const handleExploreOption = (value: string | string[]) => {
    if (typeof value === 'string') {
      setExploreAll(value === 'all');
    }
  };

  const handleExploreVizLink: MouseEventHandler<HTMLButtonElement> = (e) => {
    const path = e.currentTarget.dataset.sectionPath;
    if (exploreAll) {
      void router.push({ pathname: path, query: router.query });
    } else {
      // set the path which will trigger the search
      setPath({ path });
    }
  };

  const handleOperationsLink = (operator: Operator) => {
    if (exploreAll) {
      // new search with operator
      const query = parseQueryFromUrl(router.asPath);
      const q = createOperatorQuery(operator, query.q);
      void router.push({ pathname: '', search: makeSearchParams({ q, sort: ['score desc'] }) });
    } else {
      setPath({ operator });
    }
  };

  const handleOpsLink = useCallback((name: Operator) => () => handleOperationsLink(name), [exploreAll, router]);

  const colors = useColorModeColors();

  return (
    <Box my={2} display={isLoading ? 'none' : 'initial'}>
      <Flex
        direction="column"
        gap={1}
        mb={1}
        as="section"
        aria-labelledby="result-actions-title"
        data-testid="listactions"
      >
        <VisuallyHidden as="h2" id="result-actions-title">
          Result Actions
        </VisuallyHidden>
        <Flex justifyContent="space-between" width="full" gap={1}>
          <SortWrapper onChange={onSortChange} />
          {isClient && (
            <Flex gap={1}>
              <IconButton
                icon={<BellIcon />}
                aria-label="Create email notification of this query"
                variant="outline"
                onClick={onCreateNotificationOpen}
              />
              <SettingsMenu />
            </Flex>
          )}
        </Flex>
        {isClient && (
          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'start', md: 'center' }}
            justifyContent={{ md: 'space-between' }}
            backgroundColor={colors.panel}
            borderRadius="2px"
            p={2}
          >
            <Stack
              direction="row"
              spacing={{ base: '2', md: '5' }}
              order={{ base: '2', md: '1' }}
              mt={{ base: '2', md: '0' }}
              wrap="wrap"
            >
              <SelectAllCheckbox />
              {!noneSelected && (
                <>
                  <Text data-testid="listactions-selected">{selected.length.toLocaleString()} Selected</Text>
                  <Button variant="link" fontWeight="normal" onClick={clearSelected} data-testid="listactions-clearall">
                    Clear All
                  </Button>
                  <SecondOrderOpsLinks />
                </>
              )}
            </Stack>
            <Stack direction="row" mx={5} order={{ base: '1', md: '2' }} wrap="wrap">
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                  Bulk Actions
                </MenuButton>
                <Portal>
                  <MenuList>
                    <MenuOptionGroup
                      value={exploreAll ? 'all' : 'selected'}
                      type="radio"
                      onChange={handleExploreOption}
                    >
                      <MenuItemOption value="all" closeOnSelect={false}>
                        All
                      </MenuItemOption>
                      <MenuItemOption value="selected" isDisabled={selected.length === 0} closeOnSelect={false}>
                        Selected
                      </MenuItemOption>
                    </MenuOptionGroup>
                    <MenuDivider />
                    {isAuthenticated && (
                      <>
                        <MenuItem onClick={onOpenAddToLibrary}>Add to Library</MenuItem>
                        <MenuDivider />
                      </>
                    )}
                    <ExportMenu exploreAll={exploreAll} defaultExportFormat={settings.defaultExportFormat} />
                    <OrcidBulkMenu />
                  </MenuList>
                </Portal>
              </Menu>
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} data-testid="explorer-menu-btn">
                  Explore
                </MenuButton>
                <Portal>
                  <MenuList data-testid="explorer-menu-items">
                    <MenuOptionGroup
                      value={exploreAll ? 'all' : 'selected'}
                      type="radio"
                      onChange={handleExploreOption}
                    >
                      <MenuItemOption value="all" closeOnSelect={false}>
                        All
                      </MenuItemOption>
                      <MenuItemOption value="selected" isDisabled={selected.length === 0} closeOnSelect={false}>
                        Selected
                      </MenuItemOption>
                    </MenuOptionGroup>
                    <MenuDivider />
                    <MenuGroup title="VISUALIZATIONS">
                      {sections.map((section) => (
                        <MenuItem onClick={handleExploreVizLink} data-section-path={section.path} key={section.id}>
                          {section.label}
                        </MenuItem>
                      ))}
                    </MenuGroup>
                    <MenuDivider />
                    <MenuGroup title="OPERATIONS">
                      <MenuItem onClick={handleOpsLink('trending')} data-testid="trending-operator">
                        Trending
                      </MenuItem>
                      <MenuItem onClick={handleOpsLink('reviews')} data-testid="reviews-operator">
                        Reviews
                      </MenuItem>
                      <MenuItem onClick={handleOpsLink('useful')} data-testid="useful-operator">
                        Useful
                      </MenuItem>
                      <MenuItem onClick={handleOpsLink('similar')} data-testid="similar-operator">
                        Similar
                      </MenuItem>
                    </MenuGroup>
                  </MenuList>
                </Portal>
              </Menu>
            </Stack>
          </Stack>
        )}
      </Flex>
      <Portal>
        <AddNotificationModal isOpen={isCreateNotificationOpen} onClose={onCreateNotificationClose} />
      </Portal>
    </Box>
  );
};

const sortSelector: [
  (state: AppState) => AppState['query'],
  (prev: AppState['query'], next: AppState['query']) => boolean,
] = [(state) => state.query, (prev, curr) => prev.sort === curr.sort];

const SortWrapper = ({ onChange }: { onChange: ISortProps<SolrSort, SolrSortField>['onChange'] }) => {
  const query = useStore(...sortSelector);

  return <Sort<SolrSort, SolrSortField> sort={query.sort[0]} onChange={onChange} options={solrSortOptions} />;
};

const SettingsMenu = () => {
  return (
    <Menu isLazy autoSelect={false}>
      <MenuButton as={IconButton} aria-label="Result list settings" variant="outline" icon={<SettingsIcon />} />
      <MenuList>
        <HighlightsToggle />
      </MenuList>
    </Menu>
  );
};

const HighlightsToggle = () => {
  const showHighlights = useStore((state) => state.showHighlights);
  const toggleShowHighlights = useStore((state) => state.toggleShowHighlights);

  return (
    <Tooltip label="Show or hide keyword highlights in the results.">
      <MenuItem onClick={toggleShowHighlights} icon={<Icon as={DocumentTextIcon} fontSize={20} />} iconSpacing={4}>
        <Flex justifyContent="space-between">
          Highlights
          <Switch isChecked={showHighlights} id="show-highlights" onClick={toggleShowHighlights} />
        </Flex>
      </MenuItem>
    </Tooltip>
  );
};

const selectors = {
  selectAll: (state: AppState) => state.selectAll,
  isAllSelected: (state: AppState) => state.docs.isAllSelected,
  isSomeSelected: (state: AppState) => state.docs.isSomeSelected,
  clearAllSelected: (state: AppState) => state.clearAllSelected,
};
const useDocSelection = () => {
  const selectAll = useStore(selectors.selectAll);
  const isAllSelected = useStore(selectors.isAllSelected);
  const isSomeSelected = useStore(selectors.isSomeSelected);
  const clearAllSelected = useStore(selectors.clearAllSelected);
  return {
    selectAll,
    isAllSelected,
    isSomeSelected,
    clearAllSelected,
  };
};

const SelectAllCheckbox = () => {
  const { selectAll, isAllSelected, isSomeSelected, clearAllSelected } = useDocSelection();

  const handleChange = () => {
    isAllSelected || isSomeSelected ? clearAllSelected() : selectAll();
  };

  return (
    <Checkbox
      size="md"
      isChecked={isAllSelected}
      isIndeterminate={!isAllSelected && isSomeSelected}
      onChange={handleChange}
      data-testid="listactions-checkbox"
      aria-label={isSomeSelected || isAllSelected ? 'deselect all' : 'select all'}
    >
      Select All
    </Checkbox>
  );
};

const ExportMenu = (props: MenuGroupProps & { exploreAll: boolean; defaultExportFormat: string }): ReactElement => {
  const { exploreAll, defaultExportFormat, ...menuGroupProps } = props;
  const router = useRouter();
  const store = useStoreApi();
  const [selected, setSelected] = useState<Bibcode[]>([]);
  const [route, setRoute] = useState(['', '']);

  const { data } = useVaultBigQuerySearch(selected, { enabled: !exploreAll && selected.length > 0 });

  const defaultExportFormatValue = values(exportFormats).find((f) => f.label === defaultExportFormat).value;

  useEffect(() => {
    if (data) {
      setSelected([]);

      // when vault query is done, transition to the export page passing only qid
      void router.push(
        { pathname: route[0], query: { ...router.query, qid: data.qid } },
        { pathname: route[1], query: { ...router.query, qid: data.qid } },
      );
    }
  }, [data, route]);

  // on route change
  useEffect(() => {
    if (!exploreAll) {
      // if using a selection, update the state value (triggers a vault request)
      return setSelected(store.getState().docs.selected);
    }

    if (isNonEmptyString(route[0])) {
      // if explore all, then just use the current query, and do not trigger vault (redirect immediately)
      void router.push({ pathname: route[0], query: router.query }, { pathname: route[1], query: router.query });
    }
  }, [route]);

  const handleExportItemClick = curryN(2, (format: ExportApiFormatKey) => {
    setRoute([`/search/exportcitation/[format]`, `/search/exportcitation/${format}`]);
  });

  const handleOpenAuthorAffiliation = () => {
    setRoute(['/search/authoraffiliations', '/search/authoraffiliations']);
  };

  return (
    <MenuGroup {...menuGroupProps} title="EXPORT">
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.bibtex)}>in BibTeX</MenuItem>
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.aastex)}>in AASTeX</MenuItem>
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.endnote)}>in EndNote</MenuItem>
      <MenuItem onClick={handleExportItemClick(ExportApiFormatKey.ris)}>in RIS</MenuItem>
      <MenuItem onClick={handleExportItemClick(defaultExportFormatValue as ExportApiFormatKey)}>Other Formats</MenuItem>
      <MenuDivider />
      <MenuItem onClick={handleOpenAuthorAffiliation}>Author Affiliations</MenuItem>
    </MenuGroup>
  );
};

const createOperatorQuery = (operator: Operator, originalQuery: string) => {
  return operator === 'trending' ? `trending(${originalQuery})-(${originalQuery})` : `${operator}(${originalQuery})`;
};

const OrcidBulkMenu = () => {
  const { active } = useOrcid();

  if (!active) {
    return null;
  }

  return (
    <>
      <MenuDivider />
      <MenuGroup title="ORCID">
        <BulkClaimMenuItem />
        <BulkDeleteMenuItem />
      </MenuGroup>
    </>
  );
};
