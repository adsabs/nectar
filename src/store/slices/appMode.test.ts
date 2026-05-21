import { beforeEach, describe, expect, it } from 'vitest';
import { AppMode } from '@/types';
import { SearchMode } from '@/utils/common/searchMode';
import { createStore } from '@/store/store';

describe('appMode slice', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
    store = createStore({ mode: AppMode.ASTROPHYSICS, searchMode: SearchMode.ADS_COMPAT });
  });

  describe('setMode', () => {
    it('clears searchMode when switching away from ASTROPHYSICS while in ADS_COMPAT', () => {
      store.getState().setMode(AppMode.HELIOPHYSICS);
      expect(store.getState().searchMode).toBe(SearchMode.ALL_RELEVANT);
    });

    it('does not clear searchMode when staying in ASTROPHYSICS', () => {
      store.getState().setMode(AppMode.ASTROPHYSICS);
      expect(store.getState().searchMode).toBe(SearchMode.ADS_COMPAT);
    });

    it('does not clear searchMode when leaving ASTROPHYSICS if searchMode is ALL_RELEVANT', () => {
      store = createStore({ mode: AppMode.ASTROPHYSICS, searchMode: SearchMode.ALL_RELEVANT });
      store.getState().setMode(AppMode.GENERAL);
      expect(store.getState().searchMode).toBe(SearchMode.ALL_RELEVANT);
    });

    it('updates mode in the store', () => {
      store.getState().setMode(AppMode.HELIOPHYSICS);
      expect(store.getState().mode).toBe(AppMode.HELIOPHYSICS);
    });

    it('persists mode to scix_prefs cookie', () => {
      store.getState().setMode(AppMode.HELIOPHYSICS);
      expect(document.cookie).toContain('scix_prefs');
      const match = document.cookie.match(/scix_prefs=([^;]+)/);
      expect(match).not.toBeNull();
      const prefs = JSON.parse(decodeURIComponent(match![1]));
      expect(prefs.mode).toBe('HELIOPHYSICS');
    });

    it('removes searchMode from cookie when leaving ASTROPHYSICS in ADS_COMPAT', () => {
      store.getState().setMode(AppMode.HELIOPHYSICS);
      const match = document.cookie.match(/scix_prefs=([^;]+)/);
      expect(match).not.toBeNull();
      const prefs = JSON.parse(decodeURIComponent(match![1]));
      expect(prefs.searchMode).toBeUndefined();
    });
  });

  describe('setSearchMode', () => {
    it('sets searchMode in store', () => {
      store.getState().setSearchMode(SearchMode.ADS_COMPAT);
      expect(store.getState().searchMode).toBe(SearchMode.ADS_COMPAT);
    });

    it('updates searchMode to ALL_RELEVANT in store', () => {
      store.getState().setSearchMode(SearchMode.ALL_RELEVANT);
      expect(store.getState().searchMode).toBe(SearchMode.ALL_RELEVANT);
    });

    it('persists ADS_COMPAT searchMode to cookie', () => {
      store.getState().setSearchMode(SearchMode.ADS_COMPAT);
      const match = document.cookie.match(/scix_prefs=([^;]+)/);
      expect(match).not.toBeNull();
      const prefs = JSON.parse(decodeURIComponent(match![1]));
      expect(prefs.searchMode).toBe('ADS_COMPAT');
    });

    it('removes searchMode from cookie when switching to ALL_RELEVANT', () => {
      store.getState().setSearchMode(SearchMode.ALL_RELEVANT);
      const match = document.cookie.match(/scix_prefs=([^;]+)/);
      expect(match).not.toBeNull();
      const prefs = JSON.parse(decodeURIComponent(match![1]));
      expect(prefs.searchMode).toBeUndefined();
    });
  });
});
