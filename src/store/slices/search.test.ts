import { beforeEach, describe, expect, test } from 'vitest';
import { createStore } from '@/store/store';

describe('search slice — preview toggle reset semantics', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  test('keeps showAbstracts and showHighlights on across refinements of the same search', () => {
    store.getState().resetPreviewTogglesForQuery('star');

    store.getState().toggleShowAbstracts();
    store.getState().toggleShowHighlights();
    expect(store.getState().showAbstracts).toBe(true);
    expect(store.getState().showHighlights).toBe(true);

    store.getState().resetPreviewTogglesForQuery('star');
    expect(store.getState().showAbstracts).toBe(true);
    expect(store.getState().showHighlights).toBe(true);
  });

  test('resets both toggles when a new search (different query text) starts', () => {
    store.getState().resetPreviewTogglesForQuery('star');
    store.getState().toggleShowAbstracts();
    store.getState().toggleShowHighlights();

    store.getState().resetPreviewTogglesForQuery('galaxy');
    expect(store.getState().showAbstracts).toBe(false);
    expect(store.getState().showHighlights).toBe(false);
  });
});
