import { IFacetStoreState } from '@components/SearchFacet/store/FacetStore';
import { computeNextSelectionState } from '@components/SearchFacet/store/helpers';
import { FacetItem } from '@components/SearchFacet/types';
import { beforeEach, describe, expect, it } from 'vitest';

describe('computeNextSelectionState', () => {
  const rootAlt: FacetItem = { id: 'astronomy', val: 'astronomy', parentId: null, count: 0 };
  const root: FacetItem = { id: '0/root', val: '0/root', parentId: null, count: 0 };
  const child: FacetItem = { id: '1/root/child', val: '1/root/child', parentId: '0/root', count: 0 };

  let state: IFacetStoreState['selection'];

  beforeEach(() => {
    state = {};
  });

  it('selects a root item', () => {
    const nextState = computeNextSelectionState(root, state);
    expect(nextState).toEqual<typeof state>({
      [root.id]: { selected: true, partSelected: false },
    });
  });

  it('selects a non-hierarchial root item', () => {
    const nextState = computeNextSelectionState(rootAlt, state);
    expect(nextState).toEqual<typeof state>({
      [rootAlt.id]: { selected: true, partSelected: false },
    });
  });

  it('selects a child item', () => {
    const nextState = computeNextSelectionState(child, state);
    expect(nextState).toEqual<typeof state>({
      [root.id]: { selected: false, partSelected: true },
      [child.id]: { selected: true, partSelected: false },
    });
  });

  it('selected root is part-selected if it has child', () => {
    const selectedState: typeof state = {
      [root.id]: { selected: true, partSelected: false },
      [child.id]: { selected: true, partSelected: false },
    };
    const nextState = computeNextSelectionState(root, selectedState);
    expect(nextState).toEqual({
      [root.id]: { selected: false, partSelected: true },
      [child.id]: { selected: true, partSelected: false },
    });
  });

  it('unselects a child item', () => {
    const selectedState: typeof state = {
      [root.id]: { selected: false, partSelected: true },
      [child.id]: { selected: true, partSelected: false },
    };
    const nextState = computeNextSelectionState(child, selectedState);
    expect(nextState).toEqual({
      [root.id]: { selected: false, partSelected: false },
      [child.id]: { selected: false, partSelected: false },
    });
  });

  it('should part-select an already selected root', () => {
    const selectedState: typeof state = {
      [root.id]: { selected: true, partSelected: false },
    };
    const nextState = computeNextSelectionState(child, selectedState);
    expect(nextState).toEqual({
      [root.id]: { selected: false, partSelected: true },
      [child.id]: { selected: true, partSelected: false },
    });
  });

  it('should unselect all children if root is part-selected', () => {
    const selectedState: typeof state = {
      [root.id]: { selected: false, partSelected: true },
      [child.id]: { selected: true, partSelected: false },
    };
    const nextState = computeNextSelectionState(root, selectedState);
    expect(nextState).toEqual({
      [root.id]: { selected: false, partSelected: false },
      [child.id]: { selected: false, partSelected: false },
    });
  });
});
