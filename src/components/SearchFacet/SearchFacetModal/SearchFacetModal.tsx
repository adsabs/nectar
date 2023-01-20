import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Button,
  Divider,
  Flex,
  Heading,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { equals, head, map } from 'ramda';
import { FC, ReactElement, useEffect, useState } from 'react';
import { parseRootFromKey } from '../helpers';
import { ExpandButton, LogicArea, NodeCheckbox, SearchFacetNodeProps } from '../SearchFacetTree';
import { useFacetTreeStore, useFacetTreeStoreApi } from '../store';
import { FacetCountTuple } from '../types';
import { useGetFacetTreeData } from '../useGetFacetTreeData';
import { SearchFacetModalWrapper } from './SearchFacetModalWrapper';
import { SelectedList } from './SelectedList';

export interface ISearchFacetModalProps extends Omit<SearchFacetNodeProps, 'node' | 'onLoadMore'> {
  onClose: () => void;
  handleLoadMore: () => void;
  canLoadMore: boolean;
  isFetching: boolean;
  isError: boolean;
  isOpen: boolean;
  treeData: FacetCountTuple[];
}

export const SearchFacetModal = (props: ISearchFacetModalProps): ReactElement => {
  const { isOpen, onClose, ...facetTreeProps } = props;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalFacetTree {...facetTreeProps} />
      </ModalContent>
    </Modal>
  );
};

const ModalFacetTree: FC<Omit<ISearchFacetModalProps, 'isOpen' | 'onClose'>> = (props) => {
  const { treeData, handleLoadMore, canLoadMore, isFetching, isError, ...childProps } = props;
  const { label, hasChildren, logic, onFilter, field } = childProps;
  const [focusedNode, setFocusedNode] = useState<FacetCountTuple>(null);
  const facetStoreApi = useFacetTreeStoreApi();

  const handleExpand = (node: FacetCountTuple) => {
    setFocusedNode(node);
  };

  const handleCollapse = () => {
    facetStoreApi.getState().toggleExpand(focusedNode[0]);
    setFocusedNode(null);
  };

  const parsedRoot = parseRootFromKey(focusedNode?.[0]) ?? '';

  return (
    <>
      <ModalHeader backgroundColor="gray.100">
        <Stack direction="row" alignItems="center">
          <Heading size="lg">{label}</Heading>
          {focusedNode ? (
            <>
              <ChevronRightIcon fontSize="4xl" />
              <Heading size="lg">{parsedRoot}</Heading>
            </>
          ) : null}
        </Stack>
      </ModalHeader>
      <ModalBody>
        {focusedNode ? (
          <Stack direction="column" alignItems="start" spacing="2">
            <Button ml="-2" variant="unstyled" aria-label={`go back to ${parsedRoot}`} onClick={handleCollapse}>
              <Flex direction="row" alignItems="center">
                <ChevronLeftIcon fontSize="3xl" />
                <Text fontSize="2xl">{parsedRoot}</Text>
              </Flex>
            </Button>
            <Divider />
            <ChildList {...childProps} node={focusedNode} />
          </Stack>
        ) : (
          <SearchFacetModalWrapper
            treeData={treeData}
            canLoadMore={canLoadMore}
            onLoadMore={() => {
              handleLoadMore();
            }}
            isError={isError}
            isFetching={isFetching}
          >
            {({ tree }) => (
              <List w="full">
                {tree.map((node, i) =>
                  // if the `hasChildren` prop was set, load child tree
                  hasChildren ? (
                    <ListItem
                      w="full"
                      key={node[0]}
                      borderBottom={i === tree.length - 1 ? 'none' : 'solid 1px'}
                      borderColor="gray.100"
                      py="0.5"
                    >
                      <Text as="span" alignItems="center" display="inline-flex" w="full">
                        <NodeCheckbox isFullWidth node={node} parent={null} onClick={(e) => e.stopPropagation()} />
                        <ExpandButton
                          node={node}
                          isExpanded={equals(focusedNode, node)}
                          onToggled={() => handleExpand(node)}
                        />
                      </Text>
                    </ListItem>
                  ) : (
                    // if no children, then it's simple single-level tree, load this single node
                    <ListItem
                      w="full"
                      _hover={{ pointer: 'cursor' }}
                      key={node[0]}
                      data-testid="search-facet-item-root"
                    >
                      <Text as="span" alignItems="center" display="inline-flex" w="full">
                        <NodeCheckbox node={node} parent={null} isFullWidth />
                      </Text>
                    </ListItem>
                  ),
                )}
              </List>
            )}
          </SearchFacetModalWrapper>
        )}
        {hasChildren ? null : <SelectedList />}
      </ModalBody>
      <ModalFooter backgroundColor="white" justifyContent="center">
        <LogicArea logic={logic} onFilter={onFilter} field={field} hideDivider />
      </ModalFooter>
    </>
  );
};

const ChildList: FC<SearchFacetNodeProps> = (props) => {
  const { node, field, property, hasChildren } = props;
  const addChildren = useFacetTreeStore((state) => state.addChildren);
  const [key] = node;

  // fetches and transforms tree data for children
  const { treeData, handleLoadMore, canLoadMore, isFetching, isError } = useGetFacetTreeData({
    type: 'child',
    field,
    rawPrefix: key,
    property,
    hasChildren,
  });

  // adding children to our state
  useEffect(() => addChildren(map(head, treeData) as string[]), [treeData]);

  return (
    <>
      <SearchFacetModalWrapper
        treeData={treeData}
        canLoadMore={canLoadMore}
        onLoadMore={handleLoadMore}
        isError={isError}
        isFetching={isFetching}
      >
        {({ tree }) => (
          <List w="full">
            {tree.map((node, i) => (
              <ListItem
                borderBottom={i === tree.length - 1 ? 'none' : 'solid 1px'}
                borderColor="gray.100"
                py="0.5"
                key={node[0]}
                w="full"
                onClick={(e) => e.stopPropagation()}
                data-testid="search-facet-item-child"
              >
                <NodeCheckbox isFullWidth node={node} parent={key} />
              </ListItem>
            ))}
          </List>
        )}
      </SearchFacetModalWrapper>
    </>
  );
};
