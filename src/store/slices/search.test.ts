import { beforeEach, describe, expect, test } from 'vitest';
import { APP_DEFAULTS } from '@/config';
import { AppMode } from '@/types';
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

describe('search slice — numPerPage persistence', () => {
  let store: ReturnType<typeof createStore>;

  const readPrefs = (): Record<string, unknown> => {
    const match = document.cookie.match(/scix_prefs=([^;]+)/);
    return match ? (JSON.parse(decodeURIComponent(match[1])) as Record<string, unknown>) : {};
  };

  beforeEach(() => {
    document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
    store = createStore();
  });

  test('persists a valid numPerPage to the scix_prefs cookie', () => {
    store.getState().setNumPerPage(50);

    expect(store.getState().numPerPage).toBe(50);
    expect(readPrefs().numPerPage).toBe(50);
  });

  test('persists the coerced value when given an unsupported page size', () => {
    store.getState().setNumPerPage(7 as never);

    expect(store.getState().numPerPage).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
    expect(readPrefs().numPerPage).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
  });

  test('leaves other prefs intact when writing numPerPage', () => {
    store.getState().setMode(AppMode.HELIOPHYSICS);
    store.getState().setNumPerPage(25);

    expect(readPrefs().mode).toBe('HELIOPHYSICS');
    expect(readPrefs().numPerPage).toBe(25);
  });
});
