import { facetConfig } from '@/components/SearchFacet/config';
import { FacetItem, IFacetParams, SearchFacetID } from '@/components/SearchFacet/types';
import { omit, pick, uniq } from 'ramda';
import { createElement, FC } from 'react';
import create from 'zustand';
import createContext from 'zustand/context';
import { computeNextSelectionState, createNodes, getSelected } from './helpers';
import { ISearchFacetProps } from '@/components/SearchFacet';

type FacetParams = {
  field: IFacetParams['field'];
  hasChildren: boolean;
  facetQuery?: string;
  filter?: string[];
  logic: ISearchFacetProps['logic'];
  label: string;
  forceUppercaseInitial?: boolean;
  maxDepth?: number;
};

type SelectionState = {
  selected: boolean;
  partSelected: boolean;
};

export interface IFacetStoreState {
  // parameters
  params: FacetParams;
  nodes: Map<string, FacetItem>;

  // selection
  selection: Record<string, SelectionState>;
  selected: string[];
  focused: FacetItem;

  // modal state
  isOpen: boolean;
  sort: ['count' | 'index', 'asc' | 'desc'];
  letter: string;
  search: string;

  // For keyboard focusing
  keyboardFocus: number[]; // index
  expanded: string[];
  childrenCount: {
    [key: string]: number;
  };
}

export type FacetStoreEvents = {
  select: (node: FacetItem | string) => void;
  reset: () => void;
  setFocused: (node: FacetItem | string) => void;
  setSearch: (search: string) => void;
  setLetter: (letter: string) => void;
  setSort: (sort: IFacetStoreState['sort']) => void;
  addNodes: (nodes: FacetItem[]) => void;
  updateModal: (isOpen: boolean) => void;
  clearSelection: () => void;
  setKeyboardFocus: (index: number[]) => void;
  setExpanded: (id: string) => void;
  setCollapsed: (id: string) => void;
  setChildrenCount: (id: string, count: number) => void;
};

const initialState: IFacetStoreState = {
  params: null,
  nodes: new Map(),
  selection: {},
  selected: [],
  focused: null,
  sort: ['count', 'desc'],
  letter: 'All',
  search: '',
  isOpen: false,
  keyboardFocus: null,
  expanded: [],
  childrenCount: {},
};

const createStore = (preloadedState: Partial<IFacetStoreState>) => () =>
  create<IFacetStoreState & FacetStoreEvents>((set, get) => ({
    ...initialState,
    ...preloadedState,
    select: (node) => {
      const selection = computeNextSelectionState(node, get().selection);
      set({
        selection,
        selected: getSelected(selection),
      });
    },
    updateModal: (isOpen) =>
      set({
        isOpen,

        // if closing, reset the selection state
        selection: !isOpen ? initialState.selection : get().selection,
        selected: !isOpen ? initialState.selected : get().selected,
      }),
    setFocused: (node) =>
      set({
        focused: typeof node === 'string' ? get().nodes.get(node) : node,
        search: '',
        letter: 'All',
      }),
    setSearch: (search) => set({ search }),
    setLetter: (letter) => set({ letter }),
    addNodes: (nodes) => {
      const nodeMap = new Map(get().nodes);
      nodes.forEach((node) => nodeMap.set(node.id, node));

      set({
        nodes: nodeMap,
        selection: createNodes(nodes, get().selection),
      });
    },
    setSort: (sort) => set({ sort }),
    reset: () => set(omit(['params'], initialState)),
    clearSelection: () => set(pick(['selection', 'selected'], initialState)),
    setKeyboardFocus: (index) => set({ keyboardFocus: index }),
    setExpanded: (id) => set({ expanded: uniq([...get().expanded, id]) }),
    setCollapsed: (id) => set({ expanded: get().expanded.filter((d) => d !== id) }),
    setChildrenCount: (id, count) => set({ childrenCount: { ...get().childrenCount, [id]: count } }),
  }));

const FacetStoreContext = createContext<IFacetStoreState & FacetStoreEvents>();
export const useFacetStore = FacetStoreContext.useStore;

export const FacetStoreProvider: FC<{ facetId: SearchFacetID }> = ({ children, facetId }) => {
  const params = pick(
    ['label', 'field', 'hasChildren', 'logic', 'facetQuery', 'filter', 'forceUppercaseInitial', 'maxDepth'],
    facetConfig[facetId],
  ) as FacetParams;

  // eslint-disable-next-line react/no-children-prop
  return createElement(FacetStoreContext.Provider, {
    createStore: createStore({ params }),
    children,
  });
};

type CombinedState = IFacetStoreState & FacetStoreEvents;
export const selectors = {
  // state
  params: (state: CombinedState) => state.params,
  selection: (state: CombinedState) => state.selection,
  selected: (state: CombinedState) => state.selected,
  focused: (state: CombinedState) => state.focused,
  sort: (state: CombinedState) => state.sort,
  letter: (state: CombinedState) => state.letter,
  search: (state: CombinedState) => state.search,
  isOpen: (state: CombinedState) => state.isOpen,
  keyboardFocus: (state: CombinedState) => state.keyboardFocus,
  expanded: (state: CombinedState) => state.expanded,
  childrenCount: (state: CombinedState) => state.childrenCount,

  // actions
  select: (state: CombinedState) => state.select,
  reset: (state: CombinedState) => state.reset,
  setFocused: (state: CombinedState) => state.setFocused,
  setSearch: (state: CombinedState) => state.setSearch,
  setLetter: (state: CombinedState) => state.setLetter,
  setSort: (state: CombinedState) => state.setSort,
  addNodes: (state: CombinedState) => state.addNodes,
  updateModal: (state: CombinedState) => state.updateModal,
  clearSelection: (state: CombinedState) => state.clearSelection,
  setKeyboardFocused: (state: CombinedState) => state.setKeyboardFocus,
  setExpanded: (state: CombinedState) => state.setExpanded,
  setCollapsed: (state: CombinedState) => state.setCollapsed,
  setChildrenCount: (state: CombinedState) => state.setChildrenCount,
};
