import { FacetField, IFacetCountsFields } from '@api';
import {
  Box,
  Button,
  ButtonGroup,
  ButtonProps,
  Checkbox,
  CheckboxProps,
  Collapse,
  Divider,
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
import { ISearchFacetProps, Toggler } from '@components';
import { useGetFacetData } from '@components/SearchFacet/useGetFacetData';
import { ExclamationCircleIcon } from '@heroicons/react/solid';
import { kFormatNumber, noop } from '@utils';
import { head, map, path } from 'ramda';
import { MouseEventHandler, ReactElement, ReactNode, useCallback, useEffect, useState } from 'react';
import { parseTitleFromKey } from './helpers';
import { SearchFacetModal } from './SearchFacetModal/SearchFacetModal';
import { FacetTreeStoreProvider, useFacetTreeStore } from './store';
import { FacetCountTuple, FacetLogic, IFacetParams } from './types';

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
 * This is a root node of the facet tree, if the data is hierarchical it will load children also (when expanded)
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

  const [focusedNode, setFocusedNode] = useState<FacetCountTuple>(null);

  const { treeData, handleLoadMore, isFetching, isError, canLoadMore } = useGetFacetData({
    field,
    key: '',
    level: 'root',
    query: facetQuery,
    hasChildren,
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

  const childProps: Omit<SearchFacetNodeProps, 'node'> = {
    label,
    field,
    property,
    hasChildren,
    logic,
    facetQuery,
    filter,
    onFilter: (props) => {
      onMenuClose();
      onFilter(props);
    },
    onLoadMore: (node: FacetCountTuple) => {
      setFocusedNode(node);
      onMenuOpen();
    },
    limitChildrenList: canLoadMore,
  };

  return (
    // initialize state, and provide name for logging
    <FacetTreeStoreProvider initialRoots={initialRoots} name={field}>
      <SearchFacetModal
        handleLoadMore={handleLoadMore}
        canLoadMore={canLoadMore}
        isFetching={isFetching}
        isError={isError}
        onClose={onMenuClose}
        isOpen={isMenuOpen}
        treeData={treeData}
        initialFocusedNode={focusedNode}
        {...childProps}
      />
      {!isMenuOpen ? (
        <>
          <List {...listProps} w="full" data-testid="search-facet-list">
            {treeData.slice(0, 10).map((node) =>
              // if the `hasChildren` prop was set, load child tree
              hasChildren ? (
                <SearchFacetChildNode {...childProps} node={node} key={node[0]} />
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
          <Flex justifyContent="flex-end">
            <LoadMoreBtn
              show={treeData.length > 0 && canLoadMore && !isError}
              onClick={() => {
                onMenuOpen();
              }}
              isLoading={isFetching}
              my={2}
              fontSize="sm"
              fontWeight="normal"
            />
          </Flex>
          <LogicArea logic={logic} onFilter={onFilter} field={field} />
        </>
      ) : null}
    </FacetTreeStoreProvider>
  );
};

export const LogicArea = (props: {
  logic: ISearchFacetProps['logic'];
  onFilter: (args: OnFilterArgs) => void;
  field: FacetField;
  hideDivider?: boolean;
}) => {
  const { logic, field, onFilter, hideDivider = false } = props;

  const reset = useFacetTreeStore((state) => state.reset);
  const selectedKeys = useFacetTreeStore((state) => state.selectedKeys);
  const count = selectedKeys.length;

  const handleSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (selectedKeys.length > 0) {
        const logicChoice = e.currentTarget.getAttribute('data-value') as FacetLogic;
        onFilter({ field, logic: logicChoice, values: selectedKeys });
        reset();
      }
    },
    [selectedKeys],
  );

  const renderBtns = useCallback(
    () =>
      map<string, ReactNode>(
        (value) => (
          <Button key={value} data-value={value} onClick={handleSelect} borderRadius="none">
            {value}
          </Button>
        ),
        count > 1 ? logic.multiple : logic.single,
      ),
    [count, logic],
  );

  return (
    <Collapse in={count > 0}>
      {hideDivider ? null : <Divider my="2" />}
      <Flex justifyContent="center">
        <ButtonGroup size="sm" isAttached variant="outline">
          {renderBtns()}
        </ButtonGroup>
      </Flex>
    </Collapse>
  );
};

export type SearchFacetNodeProps = ISearchFacetTreeProps & {
  node: FacetCountTuple;
  onLoadMore?: (node: FacetCountTuple) => void;
  limitChildrenList?: boolean;
};

/**
 * Child Node
 * Renders a child tree, expects to be rendered by a root node.
 */
export const SearchFacetChildNode = (props: SearchFacetNodeProps) => {
  const { node, field, hasChildren, limitChildrenList, onLoadMore } = props;
  const addChildren = useFacetTreeStore((state) => state.addChildren);
  const [key] = node;
  const isExpanded = useFacetTreeStore(useCallback(path<boolean>(['tree', key, 'expanded']), [key]));

  // fetches and transforms tree data for children
  const { treeData, isFetching, isError, canLoadMore } = useGetFacetData({
    field,
    key,
    level: 'child',
    enabled: !!isExpanded,
    hasChildren,
  });

  // adding children to our state
  useEffect(() => addChildren(map(head, treeData) as string[]), [treeData]);

  const tData = limitChildrenList ? treeData.slice(0, 10) : treeData;

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
          <Flex justifyContent="flex-end">
            <LoadMoreBtn
              show={treeData.length > 0 && canLoadMore && !isError}
              onClick={() => {
                onLoadMore(node);
              }}
              isLoading={isFetching}
              my={2}
              fontSize="sm"
              fontWeight="normal"
            />
          </Flex>

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

export const ExpandButton = (props: { node: FacetCountTuple; isExpanded: boolean; onToggled?: () => void }) => {
  const {
    node: [key],
    isExpanded,
    onToggled = noop,
  } = props;
  const toggleExpand = useFacetTreeStore((state) => state.toggleExpand);
  const handleExpand = useCallback(() => {
    toggleExpand(key);
    onToggled();
  }, [key, toggleExpand, onToggled]);

  return (
    <ListIcon
      as={Toggler}
      isButton
      isToggled={isExpanded}
      fontSize="2xl"
      color="gray.400"
      onClick={handleExpand}
      data-testid="search-facet-expand"
    />
  );
};

/**
 * Load More Button
 */
export const LoadMoreBtn = (
  props: { show: boolean; pullRight?: boolean; showBottomBorder?: boolean; label?: string } & ButtonProps,
) => {
  const { show, pullRight, showBottomBorder, label = 'more', ...btnProps } = props;

  if (show) {
    return (
      <Stack direction="row" justifyContent={pullRight ? 'end' : 'normal'}>
        <Button size="xs" variant="outline" colorScheme="gray" p="0.5" type="button" borderRadius="md" {...btnProps}>
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

// /**
//  * Reset button
//  */
// const ResetBtn = (props: { show?: boolean; label?: string } & Omit<ButtonProps, 'onClick'>) => {
//   const { show = true, label = 'Reset', ...btnProps } = props;
//   const reset = useFacetTreeStore((state) => state.reset);

//   if (show) {
//     return (
//       <Button size="xs" variant="link" type="button" {...btnProps} onClick={reset}>
//         {label}
//       </Button>
//     );
//   }
//   return null;
// };

/**
 * Simple checkbox
 * Controlled by outer state, does not expose handlers.
 * For accessibility, checkboxes are removed from tab order and operated via keyboard
 */
export const NodeCheckbox = (
  props: CheckboxProps & {
    node: FacetCountTuple;
    parent: string | null;
    isFullWidth?: boolean;
  },
) => {
  const {
    node: [key, count],
    parent,
    isFullWidth,
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
        '.chakra-checkbox__label': { width: '100%', maxWidth: isFullWidth ? 'auto' : '200px' },
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
          <Text noOfLines={1} wordBreak="break-word" color="gray.500" fontSize="md" fontWeight="medium">
            {title}
          </Text>
        </Tooltip>
        <Text color="gray.400" fontSize="sm" fontWeight="medium">
          {kFormatNumber(count)}
        </Text>
      </Text>
    </Checkbox>
  );
};
