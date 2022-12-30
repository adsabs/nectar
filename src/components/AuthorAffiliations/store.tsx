import { IAuthorAffiliationItem } from '@api/author-affiliation/types';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { FC } from 'react';
import create, { GetState, Mutate, SetState, StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { devtools } from 'zustand/middleware';
import {
  createInitialSelection,
  getFormattedSelection,
  getSelectionState,
  groupAffilationData,
  selectDate,
  toggle,
  toggleAff,
  toggleAll,
} from './helpers';
import { AuthorAffSelectionState, IGroupedAuthorAffilationData } from './types';

export interface IAuthorAffState {
  items: IGroupedAuthorAffilationData[];
  selection: AuthorAffSelectionState;
  toggleAllState: boolean;

  reset: () => void;
  toggleAll: () => void;
  toggle: (id: string) => void;
  toggleAff: (id: string, aff: number) => void;
  selectDate: (id: string, date: string) => void;

  setItems: (items: IAuthorAffiliationItem[]) => void;
  getSelectionState: (id: string) => AuthorAffSelectionState[string];
  getFormattedSelection: () => string[];
}

interface IStoreOpts {
  items: IAuthorAffiliationItem[];
}

const createStore = (items: IAuthorAffiliationItem[]) => () => {
  const initialItems = isNotNilOrEmpty(items) ? groupAffilationData(items) : [];
  return create<
    IAuthorAffState,
    SetState<IAuthorAffState>,
    GetState<IAuthorAffState>,
    Mutate<StoreApi<IAuthorAffState>, [['zustand/devtools', never]]>
  >(
    devtools(
      (set, get) => ({
        items: initialItems,
        selection: createInitialSelection(initialItems),
        toggleAllState: false,

        reset: () =>
          set((state) => ({
            selection: createInitialSelection(state.items),
            toggleAllState: false,
          })),
        toggleAll: () =>
          set((state) => ({
            selection: toggleAll(state.toggleAllState, state.selection),
            toggleAllState: !state.toggleAllState,
          })),
        toggle: (id) => set((state) => ({ selection: toggle(id, state.selection) })),
        toggleAff: (id, aff) => set((state) => ({ selection: toggleAff(id, aff, state.selection) })),
        selectDate: (id, date) => set((state) => ({ selection: selectDate(id, date, state.selection) })),

        setItems: (items) =>
          set(() => {
            const newItems = isNotNilOrEmpty(items) ? groupAffilationData(items) : [];
            const selection = createInitialSelection(newItems);

            return { items: newItems, selection, toggleAllState: false };
          }),
        getSelectionState: (id: string) => getSelectionState(id, get().selection),
        getFormattedSelection: () => getFormattedSelection(get().items, get().selection),
      }),
      { name: `author-affiliation` },
    ),
  );
};

const AuthorAffStoreCtx = createContext<IAuthorAffState>();
export const useAuthorAffStore = AuthorAffStoreCtx.useStore;

export const AuthorAffStoreProvider: FC<IStoreOpts> = (props) => {
  const { children, items } = props;
  return <AuthorAffStoreCtx.Provider createStore={createStore(items)}>{children}</AuthorAffStoreCtx.Provider>;
};
