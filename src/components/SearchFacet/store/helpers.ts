import { getParentId } from '@components/SearchFacet/helpers';
import { IFacetStoreState } from '@components/SearchFacet/store/FacetStore';
import { FacetItem } from '@components/SearchFacet/types';
import { assoc, curry, flip, has, ifElse, lensPath, pipe, prop, reduce, set, unless, view } from 'ramda';

type Selection = IFacetStoreState['selection'];
export const computeNextSelectionState = curry((node: FacetItem | string, selection: Selection) => {
  const id = typeof node === 'string' ? node : node.id;
  const parentId = typeof node === 'string' ? getParentId(id) : node.parentId;

  // Update child
  const child = ifElse<[Selection], Selection, Selection>(
    isSelected(id),

    // SELECTED
    pipe<[Selection], Selection, Selection>(
      // unselect
      select(id, false),

      // determine part-selection of the root
      updateRootPartSelection(parentId),
    ),

    // NOT SELECTED
    pipe<[Selection], Selection, Selection, Selection>(
      // select
      select(id, true),

      // since we can guarantee at least one child is selected
      // we can just check for selected state on the parent
      // make parent only part-selected
      select(parentId, false),
      partSelect(parentId, true),
    ),
  );

  // Update root
  const root = ifElse<[Selection], Selection, Selection>(
    isSelected(id),

    // SELECTED
    pipe(
      // unselect
      select(id, false),
      // check state of the children to determine part-selection
      updateRootPartSelection(id),
    ),

    // NOT SELECTED
    ifElse<[Selection], Selection, Selection>(
      isPartSelected(id),

      // PART-SELECTED
      pipe(
        // unselect all children
        unSelectAllChildren(id),

        // un-partselect
        partSelect(id, false),
      ),

      // NOT PART-SELECTED
      pipe(
        // select and un-partselect
        select(id, true),
        partSelect(id, false),
      ),
    ),
  );

  return pipe(
    ifElse<[Selection], Selection, Selection>(
      // check if root
      () => parentId === null,
      pipe(create(id), root),
      pipe(create(id), create(parentId), child),
    ),
  )(selection);
});

/**
 * Checks if any children of the node are currently selected
 */
const anyChildrenSelected = (id: string, selection: Selection) => {
  const childrenPrefix = `1${id.slice(1)}`;
  return Object.keys(selection).some((key) => key.startsWith(childrenPrefix) && selection[key].selected);
};

/**
 * Un-selects all children of a given root id
 */
const unSelectAllChildren = curry((id: string, selection: Selection) => {
  const childrenPrefix = `1${id.slice(1)}`;
  return Object.keys(selection).reduce(
    (state, key) => (key.startsWith(childrenPrefix) ? select(key, false, state) : state),
    selection,
  );
});

/**
 * Does a part-selected if any children are selected
 */
const updateRootPartSelection = curry((id: string, selection: Selection) =>
  partSelect(id, !isSelected(id, selection) && anyChildrenSelected(id, selection), selection),
);

// lenses
const selectionLens = (id: string) => lensPath<Selection, boolean>([id, 'selected']);
const partSelectionLens = (id: string) => lensPath<Selection, boolean>([id, 'partSelected']);

// select an id
const select = curry((id: string, value: boolean, selection: Selection) => set(selectionLens(id), value, selection));

// part-select an id
const partSelect = curry((id: string, value: boolean, selection: Selection) =>
  set(partSelectionLens(id), value, selection),
);

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
