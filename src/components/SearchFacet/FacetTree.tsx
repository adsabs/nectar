import {
  Box,
  Center,
  Checkbox,
  CheckboxProps,
  Heading,
  List,
  ListIcon,
  ListItem,
  ListItemProps,
  Spinner,
  Text,
  TextProps,
  Tooltip,
} from '@chakra-ui/react';

import { getLevelFromKey, isRootNode, parseRootFromKey, parseTitleFromKey } from '@/components/SearchFacet/helpers';
import { selectors, useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { FacetItem } from '@/components/SearchFacet/types';
import { IUseGetFacetDataProps, useGetFacetData } from '@/components/SearchFacet/useGetFacetData';
import { IADSApiSearchParams } from '@/api/search/types';
import { equals } from 'ramda';
import { ForwardedRef, forwardRef, KeyboardEvent, memo, useCallback, useEffect, useRef } from 'react';
import { Toggler } from '@/components/Toggler';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { kFormatNumber } from '@/utils/common/formatters';
import { noop } from '@/utils/common/noop';
import { FacetPagination } from './FacetPagination';

export interface IFacetTreeProps extends Pick<IUseGetFacetDataProps, 'prefix' | 'level'> {
  searchParams: IADSApiSearchParams;
  parentIndex: number[];
  noLoadMore?: boolean;
  onLoadMore?: () => void;
  onError: () => void;
  searchTerm: string;
  onKeyboardFocusNext?: (index: number[]) => void;
}

/**
 * Renders a hierarchical facet tree with checkboxes.
 * Reads facet params (field, hasChildren, etc.) from the FacetStore context.
 * Receives the search query params explicitly via `searchParams`.
 */
export const FacetTree = memo(
  forwardRef((props: IFacetTreeProps, ref: ForwardedRef<HTMLDivElement>) => {
    const { searchParams, parentIndex, prefix, level, onError, onLoadMore, onKeyboardFocusNext = noop } = props;

    const params = useFacetStore(selectors.params);
    const updateModal = useFacetStore(selectors.updateModal);
    const depth = getLevelFromKey(prefix) + 1;
    const expandable = params.hasChildren && (level === 'root' || params.maxDepth > depth);
    const { treeData, isFetching, isLoading, isError } = useGetFacetData(searchParams, {
      ...params,
      prefix,
      level,
      sortDir: 'desc',
      sortField: 'count',
    });

    useEffect(() => {
      if (isError && typeof onError === 'function') {
        onError();
      }
    }, [isError, onError]);

    const setKeyboardFocus = useFacetStore(selectors.setKeyboardFocused);
    const expanded = useFacetStore(selectors.expanded);
    const childrenCount = useFacetStore(selectors.childrenCount);
    const setChildrenCount = useFacetStore(selectors.setChildrenCount);

    useEffect(() => {
      if (treeData) {
        const id = `${parentIndex.join('-')}`;
        if (!(id in childrenCount) || treeData.length !== childrenCount[id]) {
          setChildrenCount(id, treeData.length);
        }
      }
    }, [childrenCount, parentIndex, setChildrenCount, treeData]);

    if (isError) {
      return (
        <Center data-testid="search-facet-error">
          <Text>Error loading results</Text>
        </Center>
      );
    }

    if (isFetching || isLoading) {
      return (
        <Center data-testid="search-facet-loading">
          <Spinner size="sm" />
        </Center>
      );
    } else if (treeData?.length === 0) {
      return (
        <Center data-testid="search-facet-no-results">
          <Heading as="h2" size="xs">
            No Results
          </Heading>
        </Center>
      );
    }

    const handleLoadMore = () => {
      updateModal(true);
      if (typeof onLoadMore === 'function') {
        onLoadMore();
      }
    };

    const handleKeyboardFocusNext = (index: number[]) => {
      if (level === 'root') {
        if (index[0] + 1 < treeData.length) {
          setKeyboardFocus([index[0] + 1]);
        }
      } else {
        if (index[1] + 1 < treeData.length) {
          setKeyboardFocus([index[0], index[1] + 1]);
        } else {
          onKeyboardFocusNext([index[0]]);
        }
      }
    };

    const handleKeyboardFocusPrev = (index: number[]) => {
      if (level === 'root') {
        if (index[0] > 0) {
          const prevId = `${index[0] - 1}`;
          if (expanded.indexOf(prevId) !== -1) {
            setKeyboardFocus([index[0] - 1, childrenCount[prevId] - 1]);
          } else {
            setKeyboardFocus([index[0] - 1]);
          }
        }
      } else {
        if (index[1] > 0) {
          setKeyboardFocus([index[0], index[1] - 1]);
        } else {
          setKeyboardFocus([index[0]]);
        }
      }
    };

    const handleArrowUpFromLoadMore = () => {
      if (level === 'root') {
        const lastRootId = `${treeData.length - 1}`;
        setKeyboardFocus(
          expanded.indexOf(lastRootId) !== -1
            ? [treeData.length - 1, childrenCount[lastRootId] - 1]
            : [treeData.length - 1],
        );
      } else {
        setKeyboardFocus([parentIndex[0], treeData.length - 1]);
      }
    };

    const handleArrowDownFromLoadMore = () => {
      if (level !== 'root' && parentIndex[0] + 1 < treeData.length) {
        setKeyboardFocus([parentIndex[0] + 1]);
      }
    };

    return (
      <Box ref={ref}>
        <List w="full" data-testid={`search-facet-${level}-list`} pl={level === 'child' ? 4 : 0}>
          {treeData?.map((node, index) => (
            <FacetTreeItem
              node={node}
              key={node.id}
              onError={onError}
              expandable={expandable}
              index={[...parentIndex, index]}
              searchParams={searchParams}
              onKeyboardFocusNext={handleKeyboardFocusNext}
              onKeyboardFocusPrev={handleKeyboardFocusPrev}
            />
          ))}
        </List>
        <FacetPagination
          mt={level === 'root' ? 2 : 0}
          show
          onClick={handleLoadMore}
          pullRight
          onArrowUp={handleArrowUpFromLoadMore}
          onArrowDown={handleArrowDownFromLoadMore}
        />
      </Box>
    );
  }),
  equals,
);
FacetTree.displayName = 'FacetTree';

interface IFacetTreeItemProps {
  expandable: boolean;
  node: FacetItem;
  variant?: 'basic' | 'modal';
  onError: () => void;
  index: number[];
  searchParams: IADSApiSearchParams;
  onKeyboardFocusNext?: (index: number[]) => void;
  onKeyboardFocusPrev?: (index: number[]) => void;
}

const indexEqual = (a: number[], b: number[]) => {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export const FacetTreeItem = (props: IFacetTreeItemProps) => {
  const {
    node,
    variant = 'basic',
    expandable,
    onError,
    index,
    searchParams,
    onKeyboardFocusNext,
    onKeyboardFocusPrev,
  } = props;
  const setFocused = useFacetStore(selectors.setFocused);

  const keyboardFocus = useFacetStore(selectors.keyboardFocus);
  const setKeyboardFocus = useFacetStore(selectors.setKeyboardFocused);
  const expanded = useFacetStore(selectors.expanded);
  const setExpanded = useFacetStore(selectors.setExpanded);
  const setCollapsed = useFacetStore(selectors.setCollapsed);

  const checkboxRef = useRef<HTMLInputElement>();

  const itemHasKeyboardFocus = keyboardFocus !== null && indexEqual(index, keyboardFocus);

  useEffect(() => {
    if (checkboxRef.current) {
      if (itemHasKeyboardFocus) {
        checkboxRef.current.focus();
      } else {
        checkboxRef.current.blur();
      }
    }
  }, [itemHasKeyboardFocus, checkboxRef]);

  const id = `${index.join('-')}`;
  const isExpanded = expanded.indexOf(id) !== -1;

  const handleExpand = () => {
    variant === 'basic' ? (isExpanded ? setCollapsed(id) : setExpanded(id)) : setFocused(node);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (variant === 'basic') {
      if (expandable && e.key === 'ArrowRight') {
        setExpanded(id);
      } else if (expandable && e.key === 'ArrowLeft') {
        setCollapsed(id);
      } else if (e.key === 'ArrowDown') {
        if (expandable && isExpanded) {
          setKeyboardFocus([...index, 0]);
        } else {
          onKeyboardFocusNext([...index]);
        }
      } else if (e.key === 'ArrowUp') {
        onKeyboardFocusPrev([...index]);
      } else if (e.key === 'Tab') {
        setKeyboardFocus([]);
      }
    }
  };

  const listItemProps: ListItemProps = {
    w: 'full',
    _hover: { pointer: 'cursor' },
  };

  const textProps: TextProps = {
    as: 'span',
    alignItems: 'center',
    display: 'inline-flex',
    flexDir: 'row',
    w: 'full',
  };

  return (
    <>
      <ListItem
        {...listItemProps}
        data-testid={`search-facet-${expandable ? 'root' : 'child'}-item`}
        onKeyDown={handleKeyDown}
      >
        <Text {...textProps}>
          <FacetNodeCheckbox node={node} variant={variant} ref={checkboxRef} />
          {expandable ? <ExpandButton isExpanded={isExpanded} onExpand={handleExpand} /> : null}
        </Text>
      </ListItem>
      {expandable && isExpanded ? (
        <FacetTree
          searchParams={searchParams}
          prefix={node.val}
          level="child"
          onError={onError}
          onLoadMore={() => setFocused(node)}
          searchTerm=""
          parentIndex={index}
          onKeyboardFocusNext={onKeyboardFocusNext}
        />
      ) : null}
    </>
  );
};

interface IFacetNodeCheckboxProps extends CheckboxProps {
  node: FacetItem;
  variant?: 'basic' | 'modal';
}

export const FacetNodeCheckbox = forwardRef<HTMLInputElement, IFacetNodeCheckboxProps>((props, ref) => {
  const { node, variant, ...checkboxProps } = props;
  const isRoot = isRootNode(node.val);
  const label = isRoot ? parseRootFromKey(node.val) : parseTitleFromKey(node.val);
  const isSelected = useFacetStore(useCallback((state) => state.selection?.[node.id]?.selected ?? false, [node.id]));
  const isPartSelected = useFacetStore(
    useCallback((state) => state.selection?.[node.id]?.partSelected ?? false, [node.id]),
  );
  const select = useFacetStore(selectors.select);

  const colors = useColorModeColors();

  return (
    <Checkbox
      {...checkboxProps}
      ref={ref}
      name={`${label}_checkbox`}
      aria-label={`select ${label}`}
      sx={{
        '.chakra-checkbox__label': { width: '100%', maxWidth: 'auto' },
      }}
      w="full"
      isChecked={isSelected}
      isIndeterminate={isPartSelected}
      onChange={() => select(node)}
      value={node.id}
      data-testid={`search-facet-${isRoot ? 'root' : 'child'}-checkbox`}
      my={0.5}
      tabIndex={variant === 'basic' ? -1 : 0}
    >
      <Text as="span" display="inline-flex" justifyContent="space-between" w="full">
        <Tooltip label={label} placement="right">
          <Text noOfLines={1} wordBreak="break-word" color={colors.lightText} fontSize="md" fontWeight="medium">
            {label}
          </Text>
        </Tooltip>
        <Text color={colors.lightText} fontSize="md" fontWeight="medium">
          {kFormatNumber(node.count)}
        </Text>
      </Text>
    </Checkbox>
  );
});
FacetNodeCheckbox.displayName = 'FacetNodeCheckbox';

export const ExpandButton = (props: { isExpanded: boolean; onExpand: () => void }) => {
  const { isExpanded, onExpand } = props;
  return (
    <ListIcon
      as={Toggler}
      isButton
      isToggled={isExpanded}
      fontSize="2xl"
      color="gray.400"
      onClick={onExpand}
      data-testid="search-facet-expand"
      tabIndex={-1}
      aria-hidden
      aria-label=""
    />
  );
};
