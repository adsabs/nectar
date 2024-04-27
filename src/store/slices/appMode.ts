import { StoreSlice } from '@/store';
import { AppMode } from '@/types';

export interface IAppModeState {
  mode: AppMode;
}

export interface IAppModeAction {
  setMode: (mode: AppMode) => void;
}

export const appModeSlice: StoreSlice<IAppModeState & IAppModeAction> = (set, get) => ({
  mode: AppMode.GENERAL,
  setMode: (mode) => {
    set({ mode }, false, 'mode/setMode');

    // on mode change, reset facets
    get().resetSearchFacets();
  },
});
