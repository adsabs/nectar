import { beforeEach, describe, expect, test } from 'vitest';
import { createStore } from '@/store/store';

const PRIMER = Array.from({ length: 25 }, (_, i) => `bib-${i}`);
const FULL_PAGE = Array.from({ length: 500 }, (_, i) => `bib-${i}`);

describe('docs slice', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('setDocs', () => {
    test('a staged page growing past the rows already selected does not claim everything is selected', () => {
      store.getState().setDocs(PRIMER);
      store.getState().setSelected(PRIMER);
      expect(store.getState().docs.isAllSelected).toBe(true);

      store.getState().setDocs(FULL_PAGE);

      expect(store.getState().docs.isAllSelected).toBe(false);
      expect(store.getState().docs.isSomeSelected).toBe(true);
      expect(store.getState().docs.selected).toHaveLength(25);
    });

    test('a selection that survives the growing page stays reported as partial', () => {
      store.getState().setDocs(PRIMER);
      store.getState().setSelected(['bib-3', 'bib-7']);

      store.getState().setDocs(FULL_PAGE);

      expect(store.getState().docs.isSomeSelected).toBe(true);
      expect(store.getState().docs.isAllSelected).toBe(false);
    });

    test('a page that still holds every selected row keeps reporting all selected', () => {
      store.getState().setDocs(PRIMER);
      store.getState().setSelected(PRIMER);

      store.getState().setDocs(PRIMER);

      expect(store.getState().docs.isAllSelected).toBe(true);
    });

    test('a disjoint result set reports nothing selected', () => {
      store.getState().setDocs(PRIMER);
      store.getState().setSelected(PRIMER);

      store.getState().setDocs(['other-1', 'other-2']);

      expect(store.getState().docs.isAllSelected).toBe(false);
      expect(store.getState().docs.isSomeSelected).toBe(false);
    });

    test('an empty selection reports nothing selected', () => {
      store.getState().setDocs(FULL_PAGE);

      expect(store.getState().docs.isAllSelected).toBe(false);
      expect(store.getState().docs.isSomeSelected).toBe(false);
    });
  });
});
