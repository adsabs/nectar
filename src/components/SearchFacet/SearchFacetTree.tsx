import { FacetField, IFacetCountsFields } from '@api';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  ButtonProps,
  Checkbox,
  CheckboxProps,
  Collapse,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  List,
  ListIcon,
  ListItem,
  ListProps,
  Spinner,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { ISearchFacetProps, TextInput } from '@components';
import { ExclamationCircleIcon } from '@heroicons/react/solid';
import { kFormatNumber, noop } from '@utils';
import { head, map, path } from 'ramda';
import {
  ChangeEventHandler,
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { parseTitleFromKey } from './helpers';
import { FacetTreeStoreProvider, useFacetTreeStore } from './store';
import { FacetCountTuple, FacetLogic, IFacetParams } from './types';
import { FACET_DEFAULT_LIMIT, useGetFacetTreeData } from './useGetFacetTreeData';

export type OnFilterArgs = {
  logic: FacetLogic;
  field: FacetField;
  values: string[];
};

export interface ISearchFacetTreeProps extends ListProps {
  label: string;
  field: IFacetParams['field'];
  property?: keyof IFacetCountsFields;
  hasChildren: boolean;
  facetQuery?: string;
  logic: ISearchFacetProps['logic'];
  filter?: string[];
  onFilter: (args: OnFilterArgs) => void;
  onError?: () => void;
}

/**
 * Facet Tree
 *
 * This is a root node of the facet tree, if the data data is hierarchical it will load children also (when expanded)
 */
export const SearchFacetTree = (props: ISearchFacetTreeProps): ReactElement => {
  const {
    label,
    field,
    onError,
    property = 'facet_fields',
    hasChildren,
    logic,
    facetQuery,
    filter,
    onFilter,
    ...listProps
  } = props;

  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

  const { treeData, handleLoadMore, canLoadMore, isFetching, isError } = useGetFacetTreeData({
    type: 'root',
    field,
    property,
    hasChildren,
    facetQuery,
    filter,
  });

  useEffect(() => {
    if (isError && typeof onError === 'function') {
      onError();
    }
  }, [isError, onError]);

  if (isError) {
    return null;
  }

  if (treeData.length === 0 && isFetching) {
    return <Spinner size="sm" />;
  } else if (treeData.length === 0 && !isFetching) {
    return <Text size="sm">No results</Text>;
  }

  const initialRoots = map(head, treeData) as string[];

  return (
    // initialize state, and provide name for logging
    <FacetTreeStoreProvider initialRoots={initialRoots} name={field}>
      <FacetDrawer onClose={onMenuClose} isOpen={isMenuOpen} treeData={treeData}>
        {({ onSearchChange, data: filteredTreeData, isFiltered }) => (
          <>
            <DrawerHeader borderBottomWidth="1px">{label}</DrawerHeader>
            <DrawerBody>
              <Box mb="2">
                <TextInput label="Search filter results" onChange={onSearchChange} />
              </Box>
              <List {...listProps} w="full" data-testid="search-facet-list">
                {filteredTreeData.map((node) =>
                  // if the `hasChildren` prop was set, load child tree
                  hasChildren ? (
                    <SearchFacetChildNode
                      label={label}
                      field={field}
                      property={property}
                      hasChildren={hasChildren}
                      logic={logic}
                      facetQuery={facetQuery}
                      filter={filter}
                      node={node}
                      key={node[0]}
                      onFilter={onFilter}
                      onLoadMore={onMenuOpen}
                    />
                  ) : (
                    // if no children, then it's simple single-level tree, load this single node
                    <ListItem
                      w="full"
                      _hover={{ pointer: 'cursor' }}
                      key={node[0]}
                      data-testid="search-facet-item-root"
                    >
                      <Text as="span" alignItems="center" display="inline-flex" w="full">
                        <NodeCheckbox node={node} parent={null} />
                      </Text>
                    </ListItem>
                  ),
                )}
              </List>
              {/* disallow loading more when list is filtered */}
              {!isFiltered && (
                <Flex justifyContent="space-between">
                  <LoadMoreBtn
                    show={treeData.length > 0 && canLoadMore && !isError}
                    onClick={handleLoadMore}
                    isLoading={isFetching}
                    my={2}
                    fontSize="sm"
                    fontWeight="normal"
                  />
                  <ResetBtn fontSize="sm" fontWeight="normal" />
                </Flex>
              )}
            </DrawerBody>
            <DrawerFooter backgroundColor="white" justifyContent="center">
              <LogicArea
                logic={logic}
                showDivider={false}
                onFilter={(args) => {
                  onMenuClose();
                  onFilter(args);
                }}
                field={field}
              />
            </DrawerFooter>
          </>
        )}
      </FacetDrawer>

      <List {...listProps} w="full" data-testid="search-facet-list">
        {treeData.slice(0, FACET_DEFAULT_LIMIT).map((node) =>
          // if the `hasChildren` prop was set, load child tree
          hasChildren ? (
            <SearchFacetChildNode
              label={label}
              field={field}
              property={property}
              hasChildren={hasChildren}
              logic={logic}
              facetQuery={facetQuery}
              filter={filter}
              node={node}
              key={node[0]}
              onFilter={onFilter}
              onLoadMore={onMenuOpen}
              // canLoadMore is an indicator we will open a menu on this section
              limitChildrenList={canLoadMore}
            />
          ) : (
            // if no children, then it's simple single-level tree, load this single node
            <ListItem w="full" _hover={{ pointer: 'cursor' }} key={node[0]} data-testid="search-facet-item-root">
              <Text as="span" alignItems="center" display="inline-flex" w="full">
                <NodeCheckbox node={node} parent={null} />
              </Text>
            </ListItem>
          ),
        )}
      </List>
      <Flex justifyContent={treeData.length > 0 && canLoadMore && !isError ? 'space-between' : 'flex-end'}>
        <LoadMoreBtn
          show={treeData.length > 0 && canLoadMore && !isError}
          onClick={() => {
            onMenuOpen();
            handleLoadMore();
          }}
          isLoading={isFetching}
          my={2}
          fontSize="sm"
          fontWeight="normal"
        />
        <ResetBtn fontSize="sm" fontWeight="normal" />
      </Flex>
      <LogicArea logic={logic} onFilter={onFilter} field={field} />
    </FacetTreeStoreProvider>
  );
};

interface IFacetDrawerProps {
  onClose: () => void;
  isOpen: boolean;
  treeData: FacetCountTuple[];
  children: (childProps: {
    data: FacetCountTuple[];
    onSearchChange: ChangeEventHandler<HTMLInputElement>;
    isFiltered: boolean;
  }) => ReactElement;
}

/**
 * Slide-out drawer menu
 * Also encapsulates a search input for filtering results
 */
const FacetDrawer = (props: IFacetDrawerProps) => {
  const { isOpen, onClose, children, treeData = [] } = props;
  const [data, setData] = useState(treeData);
  const [isFiltered, setIsFiltered] = useState(false);
  const reset = useFacetTreeStore((state) => state.reset);

  useEffect(() => setData(treeData), [treeData]);
  const search = useDebouncedCallback((value: string) => {
    setData((data) =>
      value.length > 0 ? data.filter(([key]) => parseTitleFromKey(key).toLowerCase().includes(value)) : treeData,
    );
  }, 100);

  const onSearchChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.currentTarget.value.toLowerCase();
    setIsFiltered(value.length > 0);
    search(value);
  };

  const content = useMemo(() => children({ data, onSearchChange, isFiltered }), [data, onSearchChange, isFiltered]);

  return (
    <Drawer placement="left" onClose={onClose} isOpen={isOpen} onOverlayClick={reset} onEsc={reset}>
      <DrawerOverlay />
      <DrawerContent>{content}</DrawerContent>
    </Drawer>
  );
};

const LogicArea = (props: {
  logic: ISearchFacetProps['logic'];
  onFilter: (args: OnFilterArgs) => void;
  field: FacetField;
  showDivider?: boolean;
}) => {
  const { logic, field, onFilter, showDivider = true } = props;

  const selectedKeys = useFacetTreeStore((state) => state.selectedKeys);
  const count = selectedKeys.length;

  const handleSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (selectedKeys.length > 0) {
        const logicChoice = e.currentTarget.getAttribute('data-value') as FacetLogic;
        onFilter({ field, logic: logicChoice, values: selectedKeys });
      }
    },
    [selectedKeys],
  );

  const renderBtns = useCallback(
    () =>
      map<string, ReactNode>(
        (value) => (
          <Button key={value} data-value={value} onClick={handleSelect}>
            {value}
          </Button>
        ),
        count > 1 ? logic.multiple : logic.single,
      ),
    [count, logic],
  );

  return (
    <Collapse in={count > 0}>
      {showDivider && <Divider my="2" />}
      <Flex justifyContent="center">
        <ButtonGroup size="sm" isAttached variant="outline">
          {renderBtns()}
        </ButtonGroup>
      </Flex>
    </Collapse>
  );
};

type SearchFacetNodeProps = ISearchFacetTreeProps & {
  node: FacetCountTuple;
  onLoadMore?: () => void;
  limitChildrenList?: boolean;
};

/**
 * Child Node
 * Renders a child tree, expects to be rendered by a root node.
 */
const SearchFacetChildNode = (props: SearchFacetNodeProps) => {
  const { node, field, property, hasChildren, onLoadMore = noop, limitChildrenList } = props;
  const addChildren = useFacetTreeStore((state) => state.addChildren);
  const [key] = node;
  const isExpanded = useFacetTreeStore(useCallback(path<boolean>(['tree', key, 'expanded']), [key]));

  // fetches and transforms tree data for children
  const { treeData, handleLoadMore, canLoadMore, isFetching, isError } = useGetFacetTreeData({
    type: 'child',
    field,
    rawPrefix: key,
    enabled: !!isExpanded,
    property,
    hasChildren,
  });

  // adding children to our state
  useEffect(() => addChildren(map(head, treeData) as string[]), [treeData]);

  const tData = limitChildrenList ? treeData.slice(0, FACET_DEFAULT_LIMIT) : treeData;

  return (
    <ListItem w="full" _hover={{ pointer: 'cursor' }} data-testid="search-facet-item-root">
      {/* Render root node (data passed in as props) */}
      <Text as="span" alignItems="center" display="inline-flex" w="full">
        <ExpandButton node={node} isExpanded={isExpanded} />
        <NodeCheckbox node={node} parent={null} onClick={(e) => e.stopPropagation()} />
      </Text>

      <Collapse in={isExpanded}>
        {/* Primary loading indicator */}
        {isFetching && tData.length === 0 && <Spinner size="sm" />}
        {!isFetching && tData.length === 0 && <Text size="sm">No results</Text>}

        <Box pl="10" w="full" mb={isExpanded ? '3' : '0'}>
          {/* Render child tree */}
          <List w="full">
            {tData.map((node) => (
              <ListItem
                key={node[0]}
                w="full"
                onClick={(e) => e.stopPropagation()}
                data-testid="search-facet-item-child"
              >
                <NodeCheckbox node={node} parent={key} />
              </ListItem>
            ))}
          </List>

          <LoadMoreBtn
            show={treeData.length > 0 && canLoadMore}
            onClick={(e) => {
              e.stopPropagation();
              handleLoadMore();
              onLoadMore();
            }}
            isLoading={isFetching}
            showBottomBorder
            my={2}
            fontSize="sm"
            fontWeight="normal"
          />
          {isError && (
            <Text color="red" fontSize="xs">
              <Icon as={ExclamationCircleIcon} /> Error loading entries
            </Text>
          )}
        </Box>
      </Collapse>
    </ListItem>
  );
};

const ExpandButton = (props: { node: FacetCountTuple; isExpanded: boolean }) => {
  const {
    node: [key],
    isExpanded,
  } = props;
  const toggleExpand = useFacetTreeStore((state) => state.toggleExpand);
  const handleExpand = useCallback(() => toggleExpand(key), [key, toggleExpand]);
  return (
    <ListIcon
      as={isExpanded ? ChevronDownIcon : ChevronRightIcon}
      onClick={handleExpand}
      data-testid="search-facet-expand"
    />
  );
};

/**
 * Load More Button
 */
const LoadMoreBtn = (
  props: { show: boolean; pullRight?: boolean; showBottomBorder?: boolean; label?: string } & ButtonProps,
) => {
  const { show, pullRight, showBottomBorder, label = 'Load more', ...btnProps } = props;

  if (show) {
    return (
      <Stack direction="row" justifyContent={pullRight ? 'end' : 'normal'}>
        <Button size="xs" variant="link" type="button" {...btnProps}>
          {label}
        </Button>
      </Stack>
    );
  }
  if (show && showBottomBorder) {
    return <Divider size={'sm'} />;
  }
  return null;
};

/**
 * Reset button
 */
const ResetBtn = (props: { show?: boolean; label?: string } & Omit<ButtonProps, 'onClick'>) => {
  const { show = true, label = 'Reset', ...btnProps } = props;
  const reset = useFacetTreeStore((state) => state.reset);

  if (show) {
    return (
      <Button size="xs" variant="link" type="button" {...btnProps} onClick={reset}>
        {label}
      </Button>
    );
  }
  return null;
};

/**
 * Simple checkbox
 * Controlled by outer state, does not expose handlers.
 * For accessibility, checkboxes are removed from tab order and operated via keyboard
 */
const NodeCheckbox = (props: CheckboxProps & { node: FacetCountTuple; parent: string | null }) => {
  const {
    node: [key, count],
    parent,
    ...chbxProps
  } = props;
  const isRoot = parent === null;
  const title = parseTitleFromKey(key);

  const toggle = useFacetTreeStore((state) => state.toggleSelect);
  const isSelected = useFacetTreeStore(
    useCallback(
      (state) => {
        if (parent === null) {
          return state.tree?.[key]?.selected;
        }
        return state.tree?.[parent]?.children?.[key]?.selected;
      },
      [key, parent],
    ),
  );

  const isPartSelected = useFacetTreeStore(
    useCallback(
      (state) => {
        if (parent === null) {
          return state.tree?.[key]?.partSelected;
        }
      },
      [key, parent],
    ),
  );

  const handleSelect = () => {
    toggle(key, isRoot);
  };

  return (
    <Checkbox
      {...chbxProps}
      name={`${title}_checkbox`}
      aria-label={`select ${title}`}
      sx={{
        '.chakra-checkbox__label': { width: '100%', maxWidth: '200px' },
      }}
      w="full"
      isChecked={!!isSelected}
      isIndeterminate={!!isPartSelected}
      onChange={handleSelect}
      value={title}
      data-testid={`facet-checkbox-${isRoot ? 'root' : 'child'}`}
      my={0.5}
    >
      <Text as="span" display="inline-flex" justifyContent="space-between" w="full">
        <Tooltip label={title} placement="right">
          <Text noOfLines={1} wordBreak="break-word" fontSize="md">
            {title}
          </Text>
        </Tooltip>
        <Text color="gray.800" fontSize="xs">
          {kFormatNumber(count)}
        </Text>
      </Text>
    </Checkbox>
  );
};
