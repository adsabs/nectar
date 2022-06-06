import { Bibcode, ExportApiFormatKey, useVaultBigQuerySearch } from '@api';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
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
  useToast,
  VisuallyHidden,
} from '@chakra-ui/react';
import { ISortProps, Sort } from '@components/Sort';
import { sections } from '@components/Visualizations';
import { useIsClient } from '@hooks/useIsClient';
import { AppState, useStore, useStoreApi } from '@store';
import { makeSearchParams, noop } from '@utils';
import { useRouter } from 'next/router';
import { curryN } from 'ramda';
import { MouseEventHandler, ReactElement, useEffect, useState } from 'react';

export interface IListActionsProps {
  onSortChange?: ISortProps['onChange'];
  onShowHighlight: (show: boolean) => void;
  initialShowHighlight: boolean;
}

type Operator = 'trending' | 'reviews' | 'useful' | 'similar';

export const ListActions = (props: IListActionsProps): ReactElement => {
  const { onSortChange = noop, onShowHighlight, initialShowHighlight } = props;
  const selected = useStore((state) => state.docs.selected ?? []);
  const clearSelected = useStore((state) => state.clearSelected);
  const isClient = useIsClient();
  const noneSelected = selected.length === 0;
  const [exploreAll, setExploreAll] = useState(true);
  const router = useRouter();
  const toast = useToast();

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
        void router.push({
          pathname: '',
          query: { q: `${path.operator}(docs(${data.qid}))`, sort: ['score desc', 'bibcode desc'] },
        });
      }
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
      const q = `${operator}(${router.query.q as string})`;
      void router.push({ pathname: '', search: makeSearchParams({ q, sort: ['score desc'] }) });
    } else {
      setPath({ operator });
    }
  };

  const handleTrendingLink = () => {
    handleOperationsLink('trending');
  };

  const handleReviewsLink = () => {
    handleOperationsLink('reviews');
  };

  const handleUsefulLink = () => {
    handleOperationsLink('useful');
  };

  const handleSimilarLink = () => {
    handleOperationsLink('similar');
  };

  return (
    <Stack
      direction="column"
      spacing={1}
      mb={1}
      as="section"
      aria-labelledby="result-actions-title"
      data-testid="listactions"
    >
      <VisuallyHidden as="h2" id="result-actions-title">
        Result Actions
      </VisuallyHidden>
      <Stack direction={{ base: 'column', sm: 'row' }} spacing={1} width="min-content">
        {isClient && <HighlightsToggle onShowHighlight={onShowHighlight} initialValue={initialShowHighlight} />}
        <SortWrapper onChange={onSortChange} />
      </Stack>
      {isClient && (
        <Stack
          direction={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'start', md: 'center' }}
          justifyContent={{ md: 'space-between' }}
          backgroundColor="gray.50"
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
                <span className="m-2 h-5 text-sm">{selected.length.toLocaleString()} Selected</span>
                <Button variant="link" fontWeight="normal" onClick={clearSelected} data-testid="listactions-clearall">
                  Clear All
                </Button>
                <Button variant="link" fontWeight="normal">
                  Limited To
                </Button>
                <Button variant="link" fontWeight="normal">
                  Exclude
                </Button>
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
                  <MenuOptionGroup value={exploreAll ? 'all' : 'selected'} type="radio" onChange={handleExploreOption}>
                    <MenuItemOption value="all" closeOnSelect={false}>
                      All
                    </MenuItemOption>
                    <MenuItemOption value="selected" isDisabled={selected.length === 0} closeOnSelect={false}>
                      Selected
                    </MenuItemOption>
                  </MenuOptionGroup>
                  <MenuDivider />
                  <MenuItem isDisabled={true}>Add to Library</MenuItem>
                  <MenuDivider />
                  <ExportMenu exploreAll={exploreAll} />
                </MenuList>
              </Portal>
            </Menu>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} data-testid="explorer-menu-btn">
                Explorer
              </MenuButton>
              <Portal>
                <MenuList data-testid="explorer-menu-items">
                  <MenuOptionGroup value={exploreAll ? 'all' : 'selected'} type="radio" onChange={handleExploreOption}>
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
                    <MenuItem onClick={handleTrendingLink} data-testid="trending-operator">
                      Co-reads
                    </MenuItem>
                    <MenuItem onClick={handleReviewsLink} data-testid="reviews-operator">
                      Reviews
                    </MenuItem>
                    <MenuItem onClick={handleUsefulLink} data-testid="useful-operator">
                      Useful
                    </MenuItem>
                    <MenuItem onClick={handleSimilarLink} data-testid="similar-operator">
                      Similar
                    </MenuItem>
                  </MenuGroup>
                </MenuList>
              </Portal>
            </Menu>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

const sortSelector: [
  (state: AppState) => AppState['query'],
  (prev: AppState['query'], next: AppState['query']) => boolean,
] = [(state) => state.query, (prev, curr) => prev.sort === curr.sort];

const SortWrapper = ({ onChange }: { onChange: ISortProps['onChange'] }) => {
  const query = useStore(...sortSelector);

  return <Sort sort={query.sort} onChange={onChange} />;
};

const HighlightsToggle = ({
  onShowHighlight,
  initialValue,
}: {
  onShowHighlight: (show: boolean) => void;
  initialValue: boolean;
}) => {
  const [showHighlights, setShowHights] = useState(initialValue);
  const toggleShowHighlights = () => {
    setShowHights(!showHighlights);
  };

  useEffect(() => {
    onShowHighlight(showHighlights);
  }, [showHighlights]);

  return (
    <Button
      variant={showHighlights ? 'solid' : 'outline'}
      onClick={toggleShowHighlights}
      size="md"
      borderRadius="2px"
      data-testid="listactions-showhighlights"
    >
      Show Highlights
    </Button>
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
    />
  );
};

const ExportMenu = (props: MenuGroupProps & { exploreAll: boolean }): ReactElement => {
  const { exploreAll, ...menuGroupProps } = props;
  const router = useRouter();
  const store = useStoreApi();
  const [selected, setSelected] = useState<Bibcode[]>([]);
  const [format, setFormat] = useState(ExportApiFormatKey.bibtex);

  const { data } = useVaultBigQuerySearch(selected, { enabled: !exploreAll && selected.length > 0 });

  useEffect(() => {
    if (data) {
      setSelected([]);

      // when vault query is done, transition to the export page passing only qid
      void router.push(
        { pathname: `/search/exportcitation/[format]`, query: { ...router.query, qid: data.qid } },
        { pathname: `/search/exportcitation/${format}`, query: { ...router.query, qid: data.qid } },
      );
    }
  }, [data]);

  const handleItemClick = curryN(2, (format: ExportApiFormatKey) => {
    setFormat(format);

    if (exploreAll) {
      // if explore all, then just use the current query, and do not trigger vault
      void router.push(
        { pathname: `/search/exportcitation/[format]`, query: router.query },
        { pathname: `/search/exportcitation/${format}`, query: router.query },
      );
    } else {
      // trigger vault query
      setSelected(store.getState().docs.selected);
    }
  });

  return (
    <MenuGroup {...menuGroupProps} title="EXPORT">
      <MenuItem onClick={handleItemClick(ExportApiFormatKey.bibtex)}>in BibTeX</MenuItem>
      <MenuItem onClick={handleItemClick(ExportApiFormatKey.aastex)}>in AASTeX</MenuItem>
      <MenuItem onClick={handleItemClick(ExportApiFormatKey.endnote)}>in EndNote</MenuItem>
      <MenuItem onClick={handleItemClick(ExportApiFormatKey.ris)}>in RIS</MenuItem>
      <MenuItem onClick={handleItemClick(ExportApiFormatKey.bibtex)}>Other Formats</MenuItem>
      <MenuDivider />
      <MenuItem>Author Affiliations</MenuItem>
    </MenuGroup>
  );
};
