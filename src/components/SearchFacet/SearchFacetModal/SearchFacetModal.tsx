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
import { AlphaSorter } from '@components/SearchFacet/SearchFacetModal/AlphaSorter';
import { SearchInput } from '@components/SearchFacet/SearchFacetModal/SearchInput';
import { SortControl } from '@components/SearchFacet/SearchFacetModal/SortControl';
import { useDebounce } from '@hooks';
import { assoc, equals, mergeLeft } from 'ramda';
import { FC, ReactElement, Reducer, useEffect, useReducer, useRef, useState } from 'react';
import { parseRootFromKey } from '../helpers';
import { ExpandButton, LogicArea, NodeCheckbox, SearchFacetNodeProps } from '../SearchFacetTree';
import { useFacetTreeStoreApi } from '../store';
import { FacetCountTuple } from '../types';
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
  initialFocusedNode: FacetCountTuple;
}

export interface IModalState {
  sort: ['count' | 'alpha', 'asc' | 'desc'];
  letter: string;
  search: string;
}

type Event =
  | { type: 'setSort'; sort: IModalState['sort'] }
  | { type: 'setLetter'; letter: IModalState['letter'] }
  | { type: 'setSearch'; search: IModalState['search'] };
const reducer: Reducer<IModalState, Event> = (state, action) => {
  switch (action.type) {
    case 'setSort':
      return assoc('sort', action.sort, state);
    case 'setLetter':
      return assoc('letter', action.letter, state);
    case 'setSearch':
      return mergeLeft(
        {
          search: action.search,
          letter: 'All',
          sort: ['count', state.sort[1]],
        },
        state,
      );
    default:
      return state;
  }
};

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
  const { initialFocusedNode, ...childProps } = props;
  const { label, hasChildren, logic, onFilter, field } = childProps;
  const [focusedNode, setFocusedNode] = useState<FacetCountTuple>(initialFocusedNode);
  const pageRef = useRef(0);
  const facetStoreApi = useFacetTreeStoreApi();

  const handleExpand = (node: FacetCountTuple) => {
    setFocusedNode(node);
  };

  const handleCollapse = () => {
    facetStoreApi.getState().toggleExpand(focusedNode[0]);
    setFocusedNode(null);
  };

  const parsedRoot = parseRootFromKey(focusedNode?.[0]) ?? '';
  const [state, dispatch] = useReducer(reducer, { sort: ['count', 'desc'], letter: 'All', search: '' });
  const debouncedSearchTerm = useDebounce(
    state.sort[0] === 'alpha' ? (state.letter === 'All' ? '' : state.letter) : state.search,
    300,
  );

  useEffect(() => {
    if (pageRef.current) {
      pageRef.current = 0;
    }
  }, [state.search, state.letter]);

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
        <Flex direction="column" w="full" mb="3">
          <Stack spacing={[1, 12]} justify="space-between" alignItems="end" direction={['column', 'row']} mb="4">
            <SearchInput
              flex="2"
              search={state.search}
              onSearchChange={(search) => dispatch({ type: 'setSearch', search })}
            />
            <SortControl sort={state.sort} onSortChange={(sort) => dispatch({ type: 'setSort', sort })} />
          </Stack>
          {state.sort[0] === 'alpha' ? (
            <AlphaSorter
              justify="center"
              w="full"
              mb="2"
              letter={state.letter}
              onLetterChange={(letter) => dispatch({ type: 'setLetter', letter })}
            />
          ) : null}
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
              field={field}
              query={debouncedSearchTerm}
              level={'root'}
              key={debouncedSearchTerm}
              onPageChange={(page) => (pageRef.current = page)}
              initialPage={pageRef.current}
              sortDir={state.sort[1]}
              hasChildren={hasChildren}
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
                          <NodeCheckbox isFullWidth node={node} onClick={(e) => e.stopPropagation()} />
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
                          <NodeCheckbox node={node} isFullWidth />
                        </Text>
                      </ListItem>
                    ),
                  )}
                </List>
              )}
            </SearchFacetModalWrapper>
          )}
          {hasChildren ? null : <SelectedList />}
        </Flex>
      </ModalBody>
      <ModalFooter backgroundColor="white" justifyContent="center">
        <LogicArea logic={logic} onFilter={onFilter} field={field} hideDivider />
      </ModalFooter>
    </>
  );
};

const ChildList: FC<SearchFacetNodeProps> = (props) => {
  const { node, field, hasChildren } = props;
  const [key] = node;

  return (
    <Flex direction="column" w="full" mb="3">
      <SearchFacetModalWrapper field={field} query={key} level={'child'} hasChildren={hasChildren}>
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
                <NodeCheckbox isFullWidth node={node} isRoot={false} />
              </ListItem>
            ))}
          </List>
        )}
      </SearchFacetModalWrapper>
    </Flex>
  );
};
