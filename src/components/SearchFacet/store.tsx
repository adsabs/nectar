import { FC } from 'react';
import create, { GetState, Mutate, SetState, StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { devtools } from 'zustand/middleware';
import { addChildren, getAllSelectedKeys, initTree, parseRootFromKey, toggleExpand, updateSelection } from './helpers';
import { FacetNodeTree } from './types';
export interface IFacetTreeState {
  selectedKeys: string[];
  tree: FacetNodeTree | Record<string, never>;

  // updaters
  addChildren: (keys: string[]) => void;
  toggleSelect: (key: string, isRoot: boolean) => void;
  toggleExpand: (key: string) => void;
}

const createStore = (initialRoots: string[], name: string) => () => {
  return create<
    IFacetTreeState,
    SetState<IFacetTreeState>,
    GetState<IFacetTreeState>,
    Mutate<StoreApi<IFacetTreeState>, [['zustand/devtools', never]]>
  >(
    devtools(
      (set) => ({
        selectedKeys: [],
        tree: initialRoots ? initTree<FacetNodeTree>(initialRoots) : {},

        toggleSelect: (key, isRoot) =>
          set(
            (state) => {
              const tree = updateSelection(key, isRoot, state.tree);
              const selectedKeys = getAllSelectedKeys(tree);
              return { tree, selectedKeys };
            },
            false,
            'toggleSelect',
          ),
        toggleExpand: (key) =>
          set(
            (state) => {
              if (key) {
                return { tree: toggleExpand(key, state.tree) };
              }
            },
            false,
            'toggleExpand',
          ),
        addChildren: (keys) =>
          set(
            (state) => {
              if (keys.length > 0) {
                const root = parseRootFromKey(keys[0], true);
                return { tree: addChildren(root, keys, state.tree) };
              }
            },
            false,
            'addChildren',
          ),
      }),
      { name: `search-facet/${name}` },
    ),
  );
};

const FacetTreeStoreCtx = createContext<IFacetTreeState>();
export const useFacetTreeStore = FacetTreeStoreCtx.useStore;

export const FacetTreeStoreProvider: FC<{ initialRoots: string[]; name: string }> = ({
  children,
  initialRoots,
  name,
}) => {
  return (
    <FacetTreeStoreCtx.Provider createStore={createStore(initialRoots, name)}>{children}</FacetTreeStoreCtx.Provider>
  );
};
