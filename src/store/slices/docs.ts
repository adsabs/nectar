import { StoreSlice } from '@store';

export interface IAppStateDocsSlice {
  docs: {
    doc: string;
    current: string[];
    selected: string[];
  };
  selectDoc: (doc: string) => void;
  unSelectDoc: (doc: string) => void;
  setSelected: (selected: string[]) => void;
  setDocs: (docs: string[]) => void;
  isDocSelected: (doc: string) => boolean;
}

export const docsSlice: StoreSlice<IAppStateDocsSlice> = (set, get) => ({
  docs: {
    // bibcode of the primary abstract (viewing details)
    doc: null,

    // current search results (bibcodes), and selection
    current: [],
    selected: [],
  },

  // sets the current docs
  setDocs: (docs: string[]) => set((state) => ({ docs: { ...state.docs, current: docs } }), false, 'docs/setDocs'),

  // directly sets the selected docs array with the passed in value
  setSelected: (selected: string[]) =>
    set((state) => ({ docs: { ...state.docs, selected } }), false, 'docs/setSelected'),

  // add a doc to the selected docs array
  selectDoc: (doc: string) =>
    set(
      (state) => {
        const index = state.docs.selected.indexOf(doc);
        const selected = index === -1 ? [...state.docs.selected, doc] : state.docs.selected;
        return { docs: { ...state.docs, selected } };
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
        return { docs: { ...state.docs, selected } };
      },
      false,
      'docs/unSelectDoc',
    ),

  // checks if a doc (identifier) is present in our selected list
  isDocSelected: (doc: string) => {
    const selected = get().docs.selected ?? [];
    return selected.includes(doc);
  },
});
