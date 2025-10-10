import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  Center,
  Checkbox,
  CheckboxProps,
  Code,
  Divider,
  Heading,
  IconButton,
  IconButtonProps,
  List,
  ListIcon,
  ListItem,
  ListItemProps,
  ListProps,
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  Skeleton,
  Spinner,
  Stack,
  Text,
  TextProps,
  Tooltip,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

import { getLevelFromKey, isRootNode, parseRootFromKey, parseTitleFromKey } from '@/components/SearchFacet/helpers';
import { selectors, useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { FacetItem, FacetLogic, OnFilterArgs } from '@/components/SearchFacet/types';
import { IUseGetFacetDataProps, useGetFacetData } from '@/components/SearchFacet/useGetFacetData';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { equals, isEmpty } from 'ramda';
import {
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  memo,
  MouseEventHandler,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { SearchFacetModal } from './SearchFacetModal';

import { Pagination } from '@/components/ResultList/Pagination';
import { Toggler } from '@/components/Toggler';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { kFormatNumber } from '@/utils/common/formatters';
import { noop } from '@/utils/common/noop';
import { ArrowUpRightIcon } from '@heroicons/react/20/solid';

export interface IFacetListProps extends ListProps {
  noLoadMore?: boolean;
  onFilter?: (args: OnFilterArgs) => void;
  onError?: () => void;
  label?: string;
}

export const FacetList = (props: IFacetListProps) => {
  const { noLoadMore, onFilter, onError, label } = props;

  const focused = useFacetStore(selectors.focused);

  const clearSelection = useFacetStore(selectors.clearSelection);
  const handleOnClose = () => {
    clearSelection();
  };

  return (
    <>
      <SearchFacetModal onFilter={onFilter}>
        {({ searchTerm }) =>
          focused ? (
            <NodeListModal
              onError={onError}
              level="child"
              prefix={focused.id}
              searchTerm={searchTerm}
              parentIndex={[]}
            />
          ) : (
            <NodeListModal onError={onError} level="root" prefix="" searchTerm={searchTerm} parentIndex={[]} />
          )
        }
      </SearchFacetModal>
      <LogicSelect mt="2" onFilter={onFilter} onClose={handleOnClose} label={label}>
        <NodeList level="root" prefix="" onError={onError} noLoadMore={noLoadMore} searchTerm="" parentIndex={[]} />
      </LogicSelect>
    </>
  );
};

export interface INodeListProps extends Pick<IUseGetFacetDataProps, 'prefix' | 'level'> {
  parentIndex: number[];
  noLoadMore?: boolean;
  onLoadMore?: () => void;
  onError: () => void;
  searchTerm: string;
  onKeyboardFocusNext?: (index: number[]) => void;
}

export const NodeList = memo(
  forwardRef((props: INodeListProps, ref: ForwardedRef<HTMLDivElement>) => {
    const { parentIndex, prefix, level, onError, onLoadMore, onKeyboardFocusNext = noop } = props;

    const params = useFacetStore(selectors.params);
    const updateModal = useFacetStore(selectors.updateModal);
    const depth = getLevelFromKey(prefix) + 1;
    const expandable = params.hasChildren && (level === 'root' || params.maxDepth > depth);
    const { treeData, isFetching, isError } = useGetFacetData({
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

    if (isFetching) {
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
        // focus on next sibling
        if (index[0] + 1 < treeData.length) {
          setKeyboardFocus([index[0] + 1]);
        }
        // else do nothing
      } else {
        // focus on next sibling
        if (index[1] + 1 < treeData.length) {
          setKeyboardFocus([index[0], index[1] + 1]);
        } else {
          // focus next item in the parent level
          onKeyboardFocusNext([index[0]]);
        }
      }
    };

    const handleKeyboardFocusPrev = (index: number[]) => {
      if (level === 'root') {
        if (index[0] > 0) {
          const prevId = `${index[0] - 1}`;
          if (expanded.indexOf(prevId) !== -1) {
            // if previous is expanded, go to previous last child
            setKeyboardFocus([index[0] - 1, childrenCount[prevId] - 1]);
          } else {
            // else go to previous sibling
            setKeyboardFocus([index[0] - 1]);
          }
        }
      } else {
        // focus on previous sibling
        if (index[1] > 0) {
          setKeyboardFocus([index[0], index[1] - 1]);
        } else {
          // focus on parent
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
      // focus on next parent sibling
      if (level !== 'root' && parentIndex[0] + 1 < treeData.length) {
        setKeyboardFocus([parentIndex[0] + 1]);
      }
    };

    return (
      <Box ref={ref}>
        <List w="full" data-testid={`search-facet-${level}-list`} pl={level === 'child' ? 4 : 0}>
          {treeData?.map((node, index) => (
            <Item
              node={node}
              key={node.id}
              onError={onError}
              expandable={expandable}
              index={[...parentIndex, index]}
              onKeyboardFocusNext={handleKeyboardFocusNext}
              onKeyboardFocusPrev={handleKeyboardFocusPrev}
            />
          ))}
        </List>
        <LoadMoreBtn
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
NodeList.displayName = 'NodeList';

const capitalize = (s: string) => {
  if (typeof s === 'string' && s.length > 0) {
    try {
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch {
      return s;
    }
  }
  return s;
};
const isCapitalized = (s: string) => s === capitalize(s);

export const NodeListModal = (props: INodeListProps) => {
  const { prefix, searchTerm, level, onError } = props;

  const params = useFacetStore(selectors.params);
  const depth = getLevelFromKey(prefix) + 1;
  const expandable = params.hasChildren && (level === 'root' || params.maxDepth > depth);
  const [sortField, sortDir] = useFacetStore(selectors.sort);
  const setSearch = useFacetStore(selectors.setSearch);
  const handleCapitalizeSearchTerm = useCallback(() => setSearch(capitalize(searchTerm)), [searchTerm, setSearch]);

  const { treeData, isFetching, isError, pagination, handleLoadMore, handlePrevious, handlePageChange, totalResults } =
    useGetFacetData({
      ...params,
      searchTerm,
      prefix,
      level,
      sortField,
      sortDir,
    });

  if (isFetching) {
    return (
      <Stack spacing="2" data-testid="search-facet-loading">
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
        <Skeleton h="24px" />
      </Stack>
    );
  } else if (isEmpty(treeData)) {
    return (
      <Center data-testid="search-facet-no-results">
        <Alert status="error">
          <AlertIcon as={InformationCircleIcon} />
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            No results for <Code>{searchTerm}</Code>.{' '}
            {isCapitalized(searchTerm) ? null : (
              <Button variant="link" onClick={handleCapitalizeSearchTerm}>
                Try {capitalize(searchTerm)}?
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </Center>
    );
  }

  return (
    <>
      {isError ? (
        <Center data-testid="search-facet-error">
          <Alert status="error">
            <AlertIcon as={ExclamationTriangleIcon} />
            <AlertTitle>Error loading results</AlertTitle>
            <AlertDescription>
              Unable to load the requested page,{' '}
              <Button variant="link" onClick={() => handlePageChange(0)}>
                try again?
              </Button>
            </AlertDescription>
          </Alert>
        </Center>
      ) : (
        <List w="full" data-testid={`search-facet-${level}-list`}>
          {treeData?.map((node) => (
            <Item node={node} key={node.id} onError={onError} expandable={expandable} variant="modal" index={[]} />
          ))}
        </List>
      )}
      <Pagination
        {...pagination}
        totalResults={totalResults}
        alwaysShow={treeData?.length > 0}
        skipRouting
        hidePerPageSelect
        onNext={handleLoadMore}
        onPrevious={handlePrevious}
        onPageSelect={handlePageChange}
        isLoading={isFetching}
        noLinks
      />
    </>
  );
};

interface IItemProps {
  expandable: boolean;
  onExpand?: (node: FacetItem) => void;
  node: FacetItem;
  variant?: 'basic' | 'modal';
  onError: () => void;
  index: number[]; // index position in the tree
  onKeyboardFocusNext?: (index: number[]) => void;
  onKeyboardFocusPrev?: (index: number[]) => void;
}

const indexEqual = (a: number[], b: number[]) => {
  if (!a || !b || a.length !== b.length) {
    return false;
  } else {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
  }
  return true;
};

export const Item = (props: IItemProps) => {
  const { node, variant = 'basic', expandable, onError, index, onKeyboardFocusNext, onKeyboardFocusPrev } = props;
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
      // expand/collapse children
      if (expandable && e.key === 'ArrowRight') {
        setExpanded(id);
      } else if (expandable && e.key === 'ArrowLeft') {
        setCollapsed(id);
      } else if (e.key === 'ArrowDown') {
        // go to first child
        if (expandable && isExpanded) {
          setKeyboardFocus([...index, 0]);
        } else {
          onKeyboardFocusNext([...index]);
          // to go next sibling or next group or nothing
        }
      } else if (e.key === 'ArrowUp') {
        onKeyboardFocusPrev([...index]);
        // go to prev sib or parent or nothing
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

  if (variant === 'modal') {
    return (
      <ListItem
        {...listItemProps}
        key={node.id}
        data-testid={`search-facet-${expandable ? 'root' : 'child'}-item`}
        borderBottom="solid 1px"
        borderColor="gray.100"
        py="0.5"
        sx={{
          '&:last-child': {
            borderBottom: 'none',
          },
        }}
        onKeyDown={handleKeyDown}
      >
        <Text {...textProps}>
          <NodeCheckbox node={node} variant={variant} ref={checkboxRef} />
          {expandable ? <ListIcon as={SimpleExpandButton} onClick={handleExpand} /> : null}
        </Text>
      </ListItem>
    );
  }

  return (
    <>
      <ListItem
        {...listItemProps}
        data-testid={`search-facet-${expandable ? 'root' : 'child'}-item`}
        onKeyDown={handleKeyDown}
      >
        <Text {...textProps}>
          <NodeCheckbox node={node} variant={variant} ref={checkboxRef} />
          {expandable ? <ExpandButton isExpanded={isExpanded} onExpand={handleExpand} /> : null}
        </Text>
      </ListItem>
      {expandable && isExpanded ? (
        <NodeList
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

const SimpleExpandButton = (props: IconButtonProps) => {
  return (
    <IconButton
      {...props}
      aria-label="test"
      icon={
        <Center>
          <ChevronRightIcon color="gray.400" />
        </Center>
      }
      fontSize="2xl"
      variant="unstyled"
    />
  );
};

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
    />
  );
};

interface INodeCheckboxProps extends CheckboxProps {
  node: FacetItem;
  variant?: 'basic' | 'modal';
}

export const NodeCheckbox = forwardRef<HTMLInputElement, INodeCheckboxProps>((props, ref) => {
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
      tabIndex={variant === 'basic' ? -1 : 0} // for sidebar ('basic'), use customized keyboard navigation
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
NodeCheckbox.displayName = 'NodeCheckbox';

interface ILoadMoreBtnProps extends Omit<IconButtonProps, 'aria-label'> {
  show: boolean;
  pullRight?: boolean;
  showBottomBorder?: boolean;
  label?: string;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  totalResults?: number;
}

export const LoadMoreBtn = (props: ILoadMoreBtnProps) => {
  const {
    show,
    pullRight,
    showBottomBorder,
    label = 'more',
    onArrowUp = noop,
    onArrowDown = noop,
    ...btnProps
  } = props;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp') {
      onArrowUp();
    } else if (e.key === 'ArrowDown') {
      onArrowDown();
    }
  };

  if (show) {
    return (
      <Tooltip label="Opens full list with search and filter options" placement="right">
        <Stack direction="row" justifyContent={pullRight ? 'end' : 'normal'}>
          <IconButton
            icon={<ArrowUpRightIcon />}
            size="xs"
            variant="outline"
            colorScheme="gray"
            opacity={0.7}
            type="button"
            borderRadius="md"
            aria-label={label}
            onKeyDown={handleKeyDown}
            data-testid="search-facet-load-more-btn"
            {...btnProps}
          />
        </Stack>
      </Tooltip>
    );
  }

  if (show && showBottomBorder) {
    return <Divider size={'sm'} />;
  }
  return null;
};

const LogicSelect = (
  props: Pick<IFacetListProps, 'onFilter'> & BoxProps & { onClose: () => void; label: string },
): ReactElement => {
  const { children, onFilter, onClose, label, ...boxProps } = props;
  const params = useFacetStore((state) => state.params);
  const selected = useFacetStore((state) => state.selected);
  const reset = useFacetStore((state) => state.reset);
  const isModalOpen = useFacetStore((state) => state.isOpen);

  const handleSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (selected.length > 0) {
        const logicChoice = e.currentTarget.getAttribute('data-value') as FacetLogic;
        onFilter({ field: params.field, logic: logicChoice, values: selected });
        reset();
      }
    },
    [onFilter, params.field, reset, selected],
  );

  const logicType = selected.length > 1 ? params.logic.multiple : params.logic.single;
  const isOpen = selected.length > 0 && !isModalOpen;
  return (
    <Popover isOpen={isOpen} placement="right-start">
      <PopoverAnchor>{children}</PopoverAnchor>
      <PopoverContent maxWidth="max-content" minWidth="40">
        <PopoverHeader fontSize="md" fontWeight="bold" pr={10}>
          {`${label} (${selected.length})`}
        </PopoverHeader>
        <PopoverArrow />
        <PopoverCloseButton onClick={onClose} />
        <PopoverBody>
          <Center {...boxProps}>
            <ButtonGroup size="sm" isAttached variant="outline">
              {logicType.map((value) => (
                <Button key={value} data-value={value} onClick={handleSelect} borderRadius="none">
                  {value}
                </Button>
              ))}
            </ButtonGroup>
          </Center>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
