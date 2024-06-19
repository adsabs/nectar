import { IFacetStoreState } from '@/components/SearchFacet/store/FacetStore';
import { computeNextSelectionState } from '@/components/SearchFacet/store/helpers';
import { beforeEach, describe, expect, it } from 'vitest';

describe('computeNextSelectionState', () => {
  const ids = {
    root: '0/root',
    child: '1/root/child',
    grandChild: '2/root/child/grandchild',
    grandChild2: '2/root/child/grandchild2',
    child2: '1/root/child2',
    grandChild3: '2/root/child2/grandchild3',
    grandChild4: '2/root/child2/grandchild4',
    rootAlt: 'foo',
  };

  const initialState = {
    [ids.root]: { selected: false, partSelected: false },

    [ids.child]: { selected: false, partSelected: false },
    [ids.grandChild]: { selected: false, partSelected: false },
    [ids.grandChild2]: { selected: false, partSelected: false },

    [ids.child2]: { selected: false, partSelected: false },
    [ids.grandChild3]: { selected: false, partSelected: false },
    [ids.grandChild4]: { selected: false, partSelected: false },
  };

  let state: IFacetStoreState['selection'];
  let nonHierarchialState: IFacetStoreState['selection'];

  beforeEach(() => {
    state = { ...initialState };
    nonHierarchialState = {
      [ids.root]: { selected: false, partSelected: false },
    };
  });

  it('selects a non-hierarchial root item', () => {
    const nextState = computeNextSelectionState(ids.rootAlt, nonHierarchialState);
    expect(nextState).toStrictEqual<typeof nonHierarchialState>({
      ...nonHierarchialState,
      [ids.rootAlt]: { selected: true, partSelected: false },
    });
  });

  it('should select a root item if unselected', () => {
    const nextState = computeNextSelectionState(ids.root, state);
    expect(nextState).toEqual<typeof state>({
      ...state,
      [ids.root]: { selected: true, partSelected: false },
    });
  });

  it('should part-select the parent if we select a child', () => {
    const nextState = computeNextSelectionState(ids.grandChild, state);
    expect(nextState).toStrictEqual<typeof state>({
      ...state,
      [ids.root]: { selected: false, partSelected: true },
      [ids.child]: { selected: false, partSelected: true },
      [ids.grandChild]: { selected: true, partSelected: false },
    });
  });

  it('should unselect all children if parent is selected', () => {
    const nextState = computeNextSelectionState(ids.root, {
      ...state,
      [ids.root]: { selected: false, partSelected: true },
      [ids.child]: { selected: false, partSelected: true },
      [ids.grandChild]: { selected: true, partSelected: false },
    });
    expect(nextState).toStrictEqual<typeof state>({
      ...state,
      [ids.root]: { selected: true, partSelected: false },
    });
  });

  it('should keep parent part-selected if unselecting a sibling', () => {
    const nextState = computeNextSelectionState(ids.child2, {
      ...state,
      [ids.root]: { selected: false, partSelected: true },
      [ids.child]: { selected: true, partSelected: false },
      [ids.child2]: { selected: true, partSelected: false },
    });
    expect(nextState).toStrictEqual<typeof state>({
      ...state,
      [ids.root]: { selected: false, partSelected: true },
      [ids.child]: { selected: true, partSelected: false },
    });
  });

  it('should keep parent part-selected if unselecting a grandchild with a selected sibling', () => {
    const nextState = computeNextSelectionState(ids.grandChild, {
      ...state,
      [ids.root]: { selected: false, partSelected: true },
      [ids.child]: { selected: false, partSelected: true },
      [ids.grandChild]: { selected: true, partSelected: false },
      [ids.grandChild2]: { selected: true, partSelected: false },
    });
    expect(nextState).toStrictEqual<typeof state>({
      ...state,
      [ids.root]: { selected: false, partSelected: true },
      [ids.child]: { selected: false, partSelected: true },
      [ids.grandChild2]: { selected: true, partSelected: false },
    });
  });

  it('should unselect all children if parent is part-selected', () => {
    const nextState = computeNextSelectionState(ids.root, {
      ...state,
      [ids.root]: { selected: false, partSelected: true },
      [ids.child]: { selected: false, partSelected: true },
      [ids.grandChild]: { selected: true, partSelected: false },
      [ids.grandChild2]: { selected: true, partSelected: false },
      [ids.child2]: { selected: false, partSelected: true },
      [ids.grandChild3]: { selected: true, partSelected: false },
      [ids.grandChild4]: { selected: true, partSelected: false },
    });
    expect(nextState).toStrictEqual<typeof state>({
      ...state,
      [ids.root]: { selected: true, partSelected: false },
    });
  });
});
