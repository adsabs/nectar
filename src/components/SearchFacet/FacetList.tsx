import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  BoxProps,
  Button,
  ButtonGroup,
  Center,
  Code,
  IconButton,
  IconButtonProps,
  List,
  ListIcon,
  ListItem,
  ListProps,
  PlacementWithLogical,
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  Skeleton,
  Stack,
  Text,
  TextProps,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

import { getLevelFromKey } from '@/components/SearchFacet/helpers';
import { selectors, useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { FacetItem, FacetLogic, OnFilterArgs } from '@/components/SearchFacet/types';
import { IUseGetFacetDataProps, useGetFacetData } from '@/components/SearchFacet/useGetFacetData';
import { IADSApiSearchParams } from '@/api/search/types';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { isEmpty } from 'ramda';
import { MouseEventHandler, ReactElement, useCallback } from 'react';
import { SearchFacetModal } from './SearchFacetModal';

import { Pagination } from '@/components/ResultList/Pagination';
import { FacetNodeCheckbox } from './FacetTree';
import { FacetTree } from './FacetTree';
import { capitalizeString } from '@/utils/common/formatters';

export interface IFacetListProps extends ListProps {
  searchParams: IADSApiSearchParams;
  noLoadMore?: boolean;
  onFilter?: (args: OnFilterArgs) => void;
  onError?: () => void;
  label?: string;
}

export const FacetList = (props: IFacetListProps) => {
  const { searchParams, onFilter, onError = () => {}, label } = props;

  const focused = useFacetStore(selectors.focused);

  const clearSelection = useFacetStore(selectors.clearSelection);
  const handleOnClose = () => {
    clearSelection();
  };

  return (
    <>
      <SearchFacetModal searchParams={searchParams} onFilter={onFilter}>
        {({ searchTerm }) =>
          focused ? (
            <NodeListModal
              searchParams={searchParams}
              onError={onError}
              level="child"
              prefix={focused.id}
              searchTerm={searchTerm}
              parentIndex={[]}
            />
          ) : (
            <NodeListModal
              searchParams={searchParams}
              onError={onError}
              level="root"
              prefix=""
              searchTerm={searchTerm}
              parentIndex={[]}
            />
          )
        }
      </SearchFacetModal>
      <LogicSelect mt="2" onFilter={onFilter} onClose={handleOnClose} label={label}>
        <FacetTree
          searchParams={searchParams}
          level="root"
          prefix=""
          onError={onError}
          searchTerm=""
          parentIndex={[]}
        />
      </LogicSelect>
    </>
  );
};

export interface INodeListProps extends Pick<IUseGetFacetDataProps, 'prefix' | 'level'> {
  searchParams: IADSApiSearchParams;
  parentIndex: number[];
  noLoadMore?: boolean;
  onLoadMore?: () => void;
  onError: () => void;
  searchTerm: string;
  onKeyboardFocusNext?: (index: number[]) => void;
}

const isCapitalized = (s: string) => s === capitalizeString(s);

export const NodeListModal = (props: INodeListProps) => {
  const { searchParams, prefix, searchTerm, level } = props;

  const params = useFacetStore(selectors.params);
  const depth = getLevelFromKey(prefix) + 1;
  const expandable = params.hasChildren && (level === 'root' || params.maxDepth > depth);
  const [sortField, sortDir] = useFacetStore(selectors.sort);
  const setSearch = useFacetStore(selectors.setSearch);
  const handleCapitalizeSearchTerm = useCallback(
    () => setSearch(capitalizeString(searchTerm)),
    [searchTerm, setSearch],
  );

  const {
    treeData,
    isFetching,
    isLoading,
    isError,
    pagination,
    handleLoadMore,
    handlePrevious,
    handlePageChange,
    totalResults,
  } = useGetFacetData(searchParams, {
    ...params,
    searchTerm,
    prefix,
    level,
    sortField,
    sortDir,
  });

  if (isFetching || isLoading) {
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
                Try {capitalizeString(searchTerm)}?
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
            <ModalItem node={node} key={node.id} expandable={expandable} />
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

interface IModalItemProps {
  expandable: boolean;
  node: FacetItem;
}

/**
 * Modal-variant item with border styling and chevron expand button.
 * Only used inside NodeListModal.
 */
const ModalItem = (props: IModalItemProps) => {
  const { node, expandable } = props;
  const setFocused = useFacetStore(selectors.setFocused);

  const handleExpand = () => {
    setFocused(node);
  };

  const textProps: TextProps = {
    as: 'span',
    alignItems: 'center',
    display: 'inline-flex',
    flexDir: 'row',
    w: 'full',
  };

  return (
    <ListItem
      w="full"
      _hover={{ pointer: 'cursor' }}
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
    >
      <Text {...textProps}>
        <FacetNodeCheckbox node={node} variant="modal" />
        {expandable ? <ListIcon as={ModalExpandButton} onClick={handleExpand} /> : null}
      </Text>
    </ListItem>
  );
};

const ModalExpandButton = (props: IconButtonProps) => {
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

const LogicSelect = (
  props: Pick<IFacetListProps, 'onFilter'> & BoxProps & { onClose: () => void; label: string },
): ReactElement => {
  const { children, onFilter, onClose, label, ...boxProps } = props;
  const params = useFacetStore((state) => state.params);
  const selected = useFacetStore((state) => state.selected);
  const reset = useFacetStore((state) => state.reset);
  const isModalOpen = useFacetStore((state) => state.isOpen);
  const placement = useBreakpointValue<PlacementWithLogical>({ base: 'bottom', sm: 'right-start' });

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
    <Popover isOpen={isOpen} placement={placement}>
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
