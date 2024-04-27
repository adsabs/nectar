import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  BoxProps,
  Button,
  ButtonGroup,
  Center,
  Checkbox,
  CheckboxProps,
  Collapse,
  Divider,
  Heading,
  IconButton,
  IconButtonProps,
  List,
  ListIcon,
  ListItem,
  ListItemProps,
  ListProps,
  Skeleton,
  Spinner,
  Stack,
  Text,
  TextProps,
  Tooltip,
  useBoolean,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { Pagination, Toggler } from '@/components';
import { getLevelFromKey, isRootNode, parseRootFromKey, parseTitleFromKey } from '@/components/SearchFacet/helpers';
import { selectors, useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { FacetItem, FacetLogic, OnFilterArgs } from '@/components/SearchFacet/types';
import { IUseGetFacetDataProps, useGetFacetData } from '@/components/SearchFacet/useGetFacetData';
import { EllipsisHorizontalIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { kFormatNumber } from '@/utils';
import { equals, isEmpty } from 'ramda';
import { forwardRef, memo, MouseEventHandler, useCallback, useEffect } from 'react';
import { SearchFacetModal } from './SearchFacetModal';
import { useColorModeColors } from '@/lib';

export interface IFacetListProps extends ListProps {
  noLoadMore?: boolean;
  onFilter?: (args: OnFilterArgs) => void;
  onError?: () => void;
}

export const FacetList = (props: IFacetListProps) => {
  const { noLoadMore, onFilter, onError } = props;

  const focused = useFacetStore(selectors.focused);

  return (
    <>
      <SearchFacetModal onFilter={onFilter}>
        {({ searchTerm }) =>
          focused ? (
            <NodeListModal onError={onError} level="child" prefix={focused.id} searchTerm={searchTerm} />
          ) : (
            <NodeListModal onError={onError} level="root" prefix="" searchTerm={searchTerm} />
          )
        }
      </SearchFacetModal>
      <NodeList level="root" prefix="" onError={onError} noLoadMore={noLoadMore} searchTerm="" />
      <LogicSelect mt="2" onFilter={onFilter} />
    </>
  );
};

export interface INodeListProps extends Pick<IUseGetFacetDataProps, 'prefix' | 'level'> {
  noLoadMore?: boolean;
  onLoadMore?: () => void;
  onError: () => void;
  searchTerm: string;
}

export const NodeList = memo((props: INodeListProps) => {
  const { prefix, level, noLoadMore, onError, onLoadMore } = props;

  const params = useFacetStore(selectors.params);
  const [sortField, sortDir] = useFacetStore(selectors.sort);
  const updateModal = useFacetStore(selectors.updateModal);
  const depth = getLevelFromKey(prefix) + 1;
  const expandable = params.hasChildren && (level === 'root' || params.maxDepth > depth);
  const { treeData, isFetching, isError, canLoadMore } = useGetFacetData({
    ...params,
    prefix,
    level,
    sortDir,
    sortField,
  });

  useEffect(() => {
    if (isError && typeof onError === 'function') {
      onError();
    }
  }, [isError]);

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

  return (
    <>
      <List w="full" data-testid={`search-facet-${level}-list`} pl={level === 'child' ? 4 : 0}>
        {treeData?.map((node) => (
          <Item node={node} key={node.id} onError={onError} expandable={expandable} />
        ))}
      </List>
      <LoadMoreBtn mt={level === 'root' ? 2 : 0} show={!noLoadMore && canLoadMore} onClick={handleLoadMore} pullRight />
    </>
  );
}, equals);

export const NodeListModal = (props: INodeListProps) => {
  const { prefix, searchTerm, level, onError } = props;

  const params = useFacetStore(selectors.params);
  const depth = getLevelFromKey(prefix) + 1;
  const expandable = params.hasChildren && (level === 'root' || params.maxDepth > depth);
  const [, sortDir] = useFacetStore(selectors.sort);

  const { treeData, isFetching, isError, pagination, handleLoadMore, handlePrevious, handlePageChange, totalResults } =
    useGetFacetData({
      ...params,
      searchTerm,
      prefix,
      level,
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
          <AlertDescription>Try refining your search</AlertDescription>
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
            <Item node={node} key={node.id} onError={onError} expandable={expandable} variant="modal" />
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
}

export const Item = (props: IItemProps) => {
  const { node, variant = 'basic', expandable, onError } = props;
  const [expanded, setExpanded] = useBoolean(false);
  const setFocused = useFacetStore(selectors.setFocused);

  const handleExpand = () => {
    variant === 'basic' ? setExpanded.toggle() : setFocused(node);
  };

  const listItemProps: ListItemProps = {
    w: 'full',
    _hover: { pointer: 'cursor' },
    key: node.id,
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
        data-testid={`search-facet-${expandable ? 'root' : 'child'}-item`}
        borderBottom="solid 1px"
        borderColor="gray.100"
        py="0.5"
        sx={{
          '&:last-child': {
            borderBottom: 'none',
          },
        }}
      >
        <Text {...textProps}>
          <NodeCheckbox node={node} />
          {expandable ? <ListIcon as={SimpleExpandButton} onClick={handleExpand} /> : null}
        </Text>
      </ListItem>
    );
  }

  return (
    <>
      <ListItem {...listItemProps} data-testid={`search-facet-${expandable ? 'root' : 'child'}-item`}>
        <Text {...textProps}>
          <NodeCheckbox node={node} />
          {expandable ? <ExpandButton isExpanded={expanded} onExpand={handleExpand} /> : null}
        </Text>
      </ListItem>
      {expandable && expanded ? (
        <NodeList prefix={node.val} level="child" onError={onError} onLoadMore={() => setFocused(node)} searchTerm="" />
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
    />
  );
};

interface INodeCheckboxProps extends CheckboxProps {
  node: FacetItem;
}

export const NodeCheckbox = forwardRef<HTMLInputElement, INodeCheckboxProps>((props, ref) => {
  const { node, ...checkboxProps } = props;
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
    >
      <Text as="span" display="inline-flex" justifyContent="space-between" w="full">
        <Tooltip label={label} placement="right">
          <Text noOfLines={1} wordBreak="break-word" color={colors.lightText} fontSize="md" fontWeight="medium">
            {label}
          </Text>
        </Tooltip>
        <Text color="gray.400" fontSize="md" fontWeight="medium">
          {kFormatNumber(node.count)}
        </Text>
      </Text>
    </Checkbox>
  );
});

interface ILoadMoreBtnProps extends Omit<IconButtonProps, 'aria-label'> {
  show: boolean;
  pullRight?: boolean;
  showBottomBorder?: boolean;
  label?: string;
}

export const LoadMoreBtn = (props: ILoadMoreBtnProps) => {
  const { show, pullRight, showBottomBorder, label = 'more', ...btnProps } = props;

  if (show) {
    return (
      <Stack direction="row" justifyContent={pullRight ? 'end' : 'normal'}>
        <IconButton
          data-testid="search-facet-load-more-btn"
          icon={<EllipsisHorizontalIcon />}
          size="xs"
          variant="outline"
          colorScheme="gray"
          p="0.5"
          type="button"
          borderRadius="md"
          aria-label={label}
          {...btnProps}
        />
      </Stack>
    );
  }
  if (show && showBottomBorder) {
    return <Divider size={'sm'} />;
  }
  return null;
};

export const LogicSelect = (props: Pick<IFacetListProps, 'onFilter'> & BoxProps) => {
  const { onFilter, ...boxProps } = props;
  const params = useFacetStore((state) => state.params);
  const selected = useFacetStore((state) => state.selected);
  const reset = useFacetStore((state) => state.reset);

  const handleSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (selected.length > 0) {
        const logicChoice = e.currentTarget.getAttribute('data-value') as FacetLogic;
        onFilter({ field: params.field, logic: logicChoice, values: selected });
        reset();
      }
    },
    [selected],
  );

  const logicType = selected.length > 1 ? params.logic.multiple : params.logic.single;
  return (
    <Collapse in={selected.length > 0}>
      <Center {...boxProps}>
        <ButtonGroup size="sm" isAttached variant="outline">
          {logicType.map((value) => (
            <Button key={value} data-value={value} onClick={handleSelect} borderRadius="none">
              {value}
            </Button>
          ))}
        </ButtonGroup>
      </Center>
    </Collapse>
  );
};
