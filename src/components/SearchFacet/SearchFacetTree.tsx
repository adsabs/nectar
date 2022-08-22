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
} from '@chakra-ui/react';
import { ISearchFacetProps } from '@components';
import { ExclamationCircleIcon } from '@heroicons/react/solid';
import { kFormatNumber } from '@utils';
import { head, map } from 'ramda';
import { MouseEventHandler, ReactElement, ReactNode, useCallback, useEffect } from 'react';
import { parseTitleFromKey } from './helpers';
import { FacetTreeStoreProvider, useFacetTreeStore } from './store';
import { FacetCountTuple, FacetLogic, IFacetParams } from './types';
import { useGetFacetTreeData } from './useGetFacetTreeData';

export type OnFilterArgs = {
  logic: FacetLogic;
  field: FacetField;
  values: string[];
};

export interface ISearchFacetTreeProps extends ListProps {
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

  if (treeData.length === 0) {
    return <Spinner size="sm" />;
  }

  const initialRoots = map(head, treeData) as string[];

  return (
    // initialize state, and provide name for logging
    <FacetTreeStoreProvider initialRoots={initialRoots} name={field}>
      <List {...listProps} w="full" data-testid="search-facet-list">
        {treeData.map((node) =>
          // if the `hasChildren` prop was set, load child tree
          hasChildren ? (
            <SearchFacetChildNode
              field={field}
              property={property}
              hasChildren={hasChildren}
              logic={logic}
              facetQuery={facetQuery}
              filter={filter}
              node={node}
              key={node[0]}
              onFilter={onFilter}
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
      <LoadMoreBtn
        show={treeData.length > 0 && canLoadMore && !isError}
        onClick={(e) => {
          e.stopPropagation();
          handleLoadMore();
        }}
        isLoading={isFetching}
      />
      <LogicArea logic={logic} onFilter={onFilter} field={field} />
    </FacetTreeStoreProvider>
  );
};

const LogicArea = (props: {
  logic: ISearchFacetProps['logic'];
  onFilter: (args: OnFilterArgs) => void;
  field: FacetField;
}) => {
  const { logic, field, onFilter } = props;

  const selectedKeys = useFacetTreeStore((state) => state.selectedKeys);
  const count = selectedKeys.length;

  const handleSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      const logicChoice = e.currentTarget.getAttribute('data-value') as FacetLogic;
      onFilter({ field, logic: logicChoice, values: selectedKeys });
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
      <Divider my="2" />
      <Flex justifyContent="center">
        <ButtonGroup size="sm" isAttached variant="outline">
          {renderBtns()}
        </ButtonGroup>
      </Flex>
    </Collapse>
  );
};

type SearchFacetNodeProps = ISearchFacetTreeProps & { node: FacetCountTuple };

/**
 * Child Node
 * Renders a child tree, expects to be rendered by a root node.
 */
const SearchFacetChildNode = (props: SearchFacetNodeProps) => {
  const { node, field, property, hasChildren } = props;
  const addChildren = useFacetTreeStore((state) => state.addChildren);
  const [key] = node;
  const isExpanded = useFacetTreeStore(useCallback((state) => state.tree?.[key]?.expanded, [key]));

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

  return (
    <ListItem w="full" _hover={{ pointer: 'cursor' }} data-testid="search-facet-item-root">
      {/* Render root node (data passed in as props) */}
      <Text as="span" alignItems="center" display="inline-flex" w="full">
        <ExpandButton node={node} isExpanded={isExpanded} />
        <NodeCheckbox node={node} parent={null} onClick={(e) => e.stopPropagation()} />
      </Text>

      <Collapse in={isExpanded}>
        {/* Primary loading indicator */}
        {isFetching && treeData.length === 0 && <Spinner size="sm" />}

        <Box pl="10" w="full" mb={isExpanded ? '3' : '0'}>
          {/* Render child tree */}
          <List w="full">
            {treeData.map((node) => (
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
            }}
            isLoading={isFetching}
            showBottomBorder
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
const LoadMoreBtn = (props: { show: boolean; pullRight?: boolean; showBottomBorder?: boolean } & ButtonProps) => {
  const { show, pullRight, showBottomBorder, ...btnProps } = props;

  if (show) {
    return (
      <Stack direction="row" justifyContent={pullRight ? 'end' : 'normal'}>
        <Button size="xs" variant="link" {...btnProps}>
          Load more
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
    >
      <Text as="span" display="inline-flex" justifyContent="space-between" w="full">
        <Tooltip label={title} placement="right">
          <Text fontWeight={'bold'} noOfLines={1} wordBreak="break-word">
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
