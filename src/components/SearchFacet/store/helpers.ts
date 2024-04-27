import { getPrevKey } from '@/components/SearchFacet/helpers';
import { IFacetStoreState } from '@/components/SearchFacet/store/FacetStore';
import { FacetItem } from '@/components/SearchFacet/types';
import { assoc, curry, flip, has, ifElse, lensPath, pipe, prop, reduce, set, unless, view } from 'ramda';

type Selection = IFacetStoreState['selection'];
export const computeNextSelectionState = curry((node: FacetItem | string, selection: Selection) => {
  const id = typeof node === 'string' ? node : node.id;

  const child = ifElse<[Selection], Selection, Selection>(
    isSelected(id),

    // SELECTED
    pipe<[Selection], Selection, Selection>(
      // unselect
      select(id, false),

      // determine part-selection of the root
      updateRootPartSelection(id),
    ),

    // NOT SELECTED
    ifElse<[Selection], Selection, Selection>(
      isPartSelected(id),

      // PART-SELECTED
      pipe(
        // unselect all children
        unSelectAllChildren(id),

        // part-select all the parents
        partSelectParents(id, true),

        // select the node
        partSelect(id, false),
        select(id, true),

        // since we're selecting, we need to update the root part-selection
        updateRootPartSelection(id),
      ),

      // NOT PART-SELECTED
      pipe(
        // select the node
        select(id, true),

        // deselect the parents
        selectParents(id, false),

        // part-select the parents
        partSelectParents(id, true),
      ),
    ),
  );
  return pipe(create(id), child)(selection);
});

/**
 * Checks if any children of the node are currently selected
 */
const anyChildrenSelected = (id: string, selection: Selection) => {
  const idWithoutLevel = id.slice(1);

  return Object.keys(selection).some(
    (key) => key.slice(1).startsWith(idWithoutLevel) && key !== id && selection[key].selected,
  );
};

/**
 * Un-selects all children of a given root id
 */
const unSelectAllChildren = curry((id: string, selection: Selection) => {
  const idWithoutLevel = id.slice(1);
  return Object.keys(selection).reduce((state, key) => {
    if (key.slice(1).startsWith(idWithoutLevel) && key !== id) {
      return pipe<[Selection], Selection, Selection>(select(key, false), partSelect(key, false))(state);
    }
    return state;
  }, selection);
});

/**
 * Does a part-selected if any children are selected
 */
const updateRootPartSelection = curry((id: string, selection: Selection) => {
  return getParentIds(id).reduce((state, parentId) => {
    const change = !isSelected(parentId, state) && anyChildrenSelected(parentId, state);
    return partSelect(parentId, change, state);
  }, selection);
});

// lenses
const selectionLens = (id: string) => lensPath<Selection, boolean>([id, 'selected']);
const partSelectionLens = (id: string) => lensPath<Selection, boolean>([id, 'partSelected']);

// select an id
const select = curry((id: string, value: boolean, selection: Selection) => set(selectionLens(id), value, selection));

// part-select an id
const partSelect = curry((id: string, value: boolean, selection: Selection) =>
  set(partSelectionLens(id), value, selection),
);

const partSelectParents = curry((id: string, value: boolean, selection: Selection) => {
  const parentIds = getParentIds(id);
  return parentIds.reduce((state, parentId) => partSelect(parentId, value, state), selection);
});

const selectParents = curry((id: string, value: boolean, selection: Selection) => {
  const parentIds = getParentIds(id);
  return parentIds.reduce((state, parentId) => select(parentId, value, state), selection);
});

// checks if id is selected
const isSelected = curry((id: string, selection: Selection) => view(selectionLens(id), selection));
const isPartSelected = curry((id: string, selection: Selection) => view(partSelectionLens(id), selection));

// creates new nodes on the selection structure (if they don't exist)
const initialSelectionState: Selection[string] = { selected: false, partSelected: false };
const create = curry((id: string, selection: Selection) =>
  unless(has(id), assoc(id, initialSelectionState), selection),
);

export const createNodes = curry((nodes: FacetItem[], selection: Selection) =>
  reduce(flip(create), selection, nodes.map(prop('id'))),
);

/**
 * Get array of selected keys
 */
export const getSelected = (selection: Selection) => Object.keys(selection).filter((key) => selection[key].selected);

export const getParentIds = (id: string) => {
  const parents = [];
  let prevKey = getPrevKey(id, true);
  while (prevKey !== null) {
    parents.push(prevKey);
    prevKey = getPrevKey(prevKey, true);
  }
  return parents;
};
