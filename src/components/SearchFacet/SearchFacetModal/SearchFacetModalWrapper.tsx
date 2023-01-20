import { Flex, Icon, Spinner, Stack, Text } from '@chakra-ui/react';
import { Pagination } from '@components/ResultList';
import { usePagination } from '@components/ResultList/Pagination/usePagination';
import { ExclamationCircleIcon } from '@heroicons/react/solid';
import {
  ascend,
  assoc,
  curry,
  descend,
  equals,
  filter,
  ifElse,
  mergeLeft,
  pipe,
  reverse,
  sort,
  sortBy,
  unless,
} from 'ramda';
import { isEmptyString } from 'ramda-adjunct';
import { FC, ReactChild, Reducer, useReducer } from 'react';
import { parseRootFromKey } from '../helpers';
import { FacetCountTuple } from '../types';
import { AlphaSorter } from './AlphaSorter';
import { SearchInput } from './SearchInput';
import { SelectedList } from './SelectedList';
import { SortControl } from './SortControl';

interface ISearchFacetModalWrapperProps {
  treeData: FacetCountTuple[];
  onLoadMore: () => void;
  canLoadMore: boolean;
  isFetching: boolean;
  isError: boolean;
  children: (props: { tree: FacetCountTuple[] }) => ReactChild;
}

export interface IModalState {
  page: number;
  sort: ['count' | 'alpha', 'asc' | 'desc'];
  letter: string;
  search: string;
}
type Event =
  | { type: 'setSort'; sort: IModalState['sort'] }
  | { type: 'setPage'; page: IModalState['page'] }
  | { type: 'setLetter'; letter: IModalState['letter'] }
  | { type: 'setSearch'; search: IModalState['search'] };
const reducer: Reducer<IModalState, Event> = (state, action) => {
  switch (action.type) {
    case 'setSort':
      return assoc('sort', action.sort, state);
    case 'setPage':
      return assoc('page', action.page, state);
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

// some helpers
const sortCountDesc = sort(descend<FacetCountTuple>((v) => v[1]));
const sortCountAsc = sort(ascend<FacetCountTuple>((v) => v[1]));
const sortAlphaDesc = sortBy<FacetCountTuple>((v) => v[0]);
const sortAlphaAsc = pipe<[FacetCountTuple[]], FacetCountTuple[], FacetCountTuple[]>(sortAlphaDesc, reverse);

const sortByCount = curry((sortValue: IModalState['sort'], tree: FacetCountTuple[]) => {
  const [type, dir] = sortValue;
  if (type === 'count') {
    return dir === 'asc' ? sortCountAsc(tree) : sortCountDesc(tree);
  }
  return sortCountDesc(tree);
});

const sortByAlpha = curry((sortValue: IModalState['sort'], tree: FacetCountTuple[]) => {
  const [type, dir] = sortValue;
  if (type === 'alpha') {
    return dir === 'asc' ? sortAlphaAsc(tree) : sortAlphaDesc(tree);
  }
  return sortAlphaDesc(tree);
});

export const SearchFacetModalWrapper: FC<ISearchFacetModalWrapperProps> = (props) => {
  const { treeData, onLoadMore, canLoadMore, isFetching, isError, children } = props;
  const [state, dispatch] = useReducer(reducer, { page: 1, sort: ['count', 'desc'], letter: 'All', search: '' });

  // pagination state & updater
  const { getPaginationProps } = usePagination({
    numFound: treeData.length,
    onStateChange: (pagination) => {
      if (pagination.page !== state.page) {
        dispatch({ type: 'setPage', page: pagination.page });
      }
    },
  });

  const pagination = getPaginationProps();

  const searchRgx = new RegExp(`^${state.search}`, 'i');
  const tData = pipe<[FacetCountTuple[]], FacetCountTuple[], FacetCountTuple[], FacetCountTuple[]>(
    unless(
      () => isEmptyString(state.search),
      filter<FacetCountTuple>((key) => searchRgx.test(parseRootFromKey(key[0]))),
    ),
    unless(
      () => equals('All', state.letter),
      filter<FacetCountTuple>((key) => parseRootFromKey(key[0]).startsWith(state.letter)),
    ),
    ifElse(() => equals(state.sort[0], 'count'), sortByCount(state.sort), sortByAlpha(state.sort)),
  )(treeData);

  return (
    <Flex direction="column" w="full" mb="3">
      <Stack spacing={[1, 16]} justify="space-between" direction={['column', 'row']} mb="4">
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
          treeData={isEmptyString(state.search) ? treeData : tData}
          letter={state.letter}
          onLetterChange={(letter) => dispatch({ type: 'setLetter', letter })}
        />
      ) : null}

      {/* Primary loading indicator */}
      {isFetching && tData.length === 0 && <Spinner size="sm" />}
      {!isFetching && tData.length === 0 && <Text size="sm">No results</Text>}

      {/* Render child tree */}
      {children({ tree: tData.slice(pagination.startIndex, pagination.endIndex) })}

      <SelectedList />

      <Pagination
        {...pagination}
        totalResults={tData.length}
        alwaysShow={tData.length > 0}
        skipRouting
        hidePerPageSelect
        onNext={() => {
          // should indicate we are on the last page
          if (pagination.noNext && canLoadMore) {
            onLoadMore();
          }
        }}
        canNext={() => canLoadMore}
      />

      {isError && (
        <Text color="red" fontSize="xs">
          <Icon as={ExclamationCircleIcon} /> Error loading entries
        </Text>
      )}
    </Flex>
  );
};
