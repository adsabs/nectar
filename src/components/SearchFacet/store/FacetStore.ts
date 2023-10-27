import { ISearchFacetProps } from '@components';
import { facetConfig } from '@components/SearchFacet/config';
import { FacetItem, IFacetParams, SearchFacetID } from '@components/SearchFacet/types';
import { omit, pick } from 'ramda';
import { createElement, FC } from 'react';
import create from 'zustand';
import createContext from 'zustand/context';
import { computeNextSelectionState, createNodes, getSelected } from './helpers';

type FacetParams = {
  field: IFacetParams['field'];
  hasChildren: boolean;
  facetQuery?: string;
  filter?: string[];
  logic: ISearchFacetProps['logic'];
  label: string;
  forceUppercaseInitial?: boolean;
};

type SelectionState = {
  selected: boolean;
  partSelected: boolean;
};

export interface IFacetStoreState {
  // parameters
  params: FacetParams;

  // selection
  selection: Record<string, SelectionState>;
  selected: string[];
  focused: FacetItem;

  // modal state
  isOpen: boolean;
  sort: ['count' | 'index', 'asc' | 'desc'];
  letter: string;
  search: string;
}

export type FacetStoreEvents = {
  select: (node: FacetItem | string) => void;
  reset: () => void;
  setFocused: (node: FacetItem) => void;
  setSearch: (search: string) => void;
  setLetter: (letter: string) => void;
  setSort: (sort: IFacetStoreState['sort']) => void;
  addNodes: (nodes: FacetItem[]) => void;
  updateModal: (isOpen: boolean) => void;
  clearSelection: () => void;
};

const initialState: IFacetStoreState = {
  params: null,
  selection: {},
  selected: [],
  focused: null,
  sort: ['count', 'desc'],
  letter: 'All',
  search: '',
  isOpen: false,
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
    setFocused: (focused) => set({ focused, search: '', letter: 'All' }),
    setSearch: (search) => set({ search }),
    setLetter: (letter) => set({ letter }),
    addNodes: (nodes) => set({ selection: createNodes(nodes, get().selection) }),
    setSort: (sort) => set({ sort }),
    reset: () => set(omit(['params'], initialState)),
    clearSelection: () => set(pick(['selection', 'selected'], initialState)),
  }));

const FacetStoreContext = createContext<IFacetStoreState & FacetStoreEvents>();
export const useFacetStore = FacetStoreContext.useStore;

export const FacetStoreProvider: FC<{ facetId: SearchFacetID }> = ({ children, facetId }) => {
  const params = pick(
    ['label', 'field', 'hasChildren', 'logic', 'facetQuery', 'filter', 'forceUppercaseInitial'],
    facetConfig[facetId],
  ) as FacetParams;
  return createElement(FacetStoreContext.Provider, { createStore: createStore({ params }), children });
};
