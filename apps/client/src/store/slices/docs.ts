import { StoreSlice } from '@/store';
import { difference, equals, intersection, union } from 'ramda';

export interface IDocsState {
  docs: {
    doc: string;
    current: string[];
    selected: string[];
    isAllSelected: boolean;
    isSomeSelected: boolean;
  };
}

export interface IDocsAction {
  // single doc
  selectDoc: (doc: string) => void;
  unSelectDoc: (doc: string) => void;

  // bulk (multiple)
  clearSelected: () => void;
  clearAllSelected: () => void;
  setSelected: (selected: string[]) => void;
  setDocs: (docs: string[]) => void;
  selectAll: () => void;

  // utilities
  isDocSelected: (doc: string) => boolean;
}

export const docsSlice: StoreSlice<IDocsState & IDocsAction> = (set, get) => ({
  docs: {
    // bibcode of the primary abstract (viewing details)
    doc: null,

    // current search results (bibcodes), and selection
    current: [],
    selected: [],
    isAllSelected: false,
    isSomeSelected: false,
  },

  // sets the current docs
  setDocs: (docs: string[]) =>
    set(
      (state) => ({ docs: { ...state.docs, current: docs, isAllSelected: false, isSomeSelected: false } }),
      false,
      'docs/setDocs',
    ),

  // directly sets the selected docs array with the passed in value
  setSelected: (selected: string[]) =>
    set(
      (state) => ({
        docs: {
          ...state.docs,
          selected,
          isAllSelected: getIsAllSelected({ ...state.docs, selected }),
          isSomeSelected: getIsSomeSelected({ ...state.docs, selected }),
        },
      }),
      false,
      'docs/setSelected',
    ),

  // add a doc to the selected docs array
  selectDoc: (doc: string) =>
    set(
      (state) => {
        const index = state.docs.selected.indexOf(doc);
        const selected = index === -1 ? [...state.docs.selected, doc] : state.docs.selected;
        return {
          docs: {
            ...state.docs,
            selected,
            isAllSelected: getIsAllSelected({ ...state.docs, selected }),
            isSomeSelected: getIsSomeSelected({ ...state.docs, selected }),
          },
        };
      },
      false,
      'docs/selectDoc',
    ),

  // remove a doc from the selected docs array
  unSelectDoc: (doc: string) =>
    set(
      (state) => {
        const index = state.docs.selected.indexOf(doc);
        const selected = index === -1 ? state.docs.selected : state.docs.selected.filter((_v, i) => i !== index);
        return {
          docs: {
            ...state.docs,
            selected,
            isAllSelected: false,
            isSomeSelected: getIsSomeSelected({ ...state.docs, selected }),
          },
        };
      },
      false,
      'docs/unSelectDoc',
    ),

  // checks if a doc (identifier) is present in our selected list
  isDocSelected: (doc: string) => {
    const selected = get().docs.selected ?? [];
    return selected.includes(doc);
  },

  // fully clear the selected list
  clearSelected: () =>
    set(
      (state) => ({ docs: { ...state.docs, selected: [], isAllSelected: false, isSomeSelected: false } }),
      false,
      'docs/clearSelected',
    ),

  // make the new selection the union between the two lists
  selectAll: () =>
    set(
      (state) => ({
        docs: {
          ...state.docs,
          selected: union(state.docs.selected, state.docs.current),
          isAllSelected: true,
          isSomeSelected: true,
        },
      }),
      false,
      'docs/selectAll',
    ),

  // remove items that exist in both lists, but keep the others in `selected` intact
  clearAllSelected: () =>
    set(
      (state) => ({
        docs: {
          ...state.docs,
          selected: difference(state.docs.selected, state.docs.current),
          isAllSelected: false,
          isSomeSelected: false,
        },
      }),
      false,
      'docs/clearAllSelected',
    ),
});

const getIsAllSelected = (docs: IDocsState['docs']) => equals(intersection(docs.current, docs.selected), docs.current);

const getIsSomeSelected = (docs: IDocsState['docs']) => intersection(docs.current, docs.selected).length > 0;
