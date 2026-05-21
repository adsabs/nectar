// src/store/slices/appMode.ts
import { StoreSlice } from '@/store';
import { AppMode } from '@/types';
import { writePrefsCookie } from '@/utils/common/prefs-cookie';
import { SearchMode } from '@/utils/common/searchMode';

export interface IAppModeState {
  mode: AppMode;
  searchMode: string;
  modeNoticeVisible: boolean;
  urlModePrevious: AppMode | null;
  urlModeOverride: AppMode | null;
  urlModeUserSelected: boolean;
  urlModePendingParam: string | null;
}

export interface IAppModeAction {
  setMode: (mode: AppMode) => void;
  setSearchMode: (mode: string) => void;
  showModeNotice: () => void;
  dismissModeNotice: () => void;
  dismissModeNoticeSilently: () => void;
  setUrlModePrevious: (mode: AppMode | null) => void;
  setUrlModeOverride: (mode: AppMode | null) => void;
  setUrlModeUserSelected: (selected: boolean) => void;
  setUrlModePendingParam: (param: string | null) => void;
}

export const appModeSlice: StoreSlice<IAppModeState & IAppModeAction> = (set, get) => ({
  mode: AppMode.GENERAL,
  searchMode: SearchMode.ALL_RELEVANT,
  modeNoticeVisible: false,
  urlModePrevious: null,
  urlModeOverride: null,
  urlModeUserSelected: false,
  urlModePendingParam: null,
  setMode: (mode) => {
    const update: Partial<IAppModeState> = { mode };
    if (mode !== AppMode.ASTROPHYSICS && get().searchMode === SearchMode.ADS_COMPAT) {
      update.searchMode = SearchMode.ALL_RELEVANT;
      writePrefsCookie({ searchMode: undefined });
    }
    set(update, false, 'mode/setMode');
    get().resetSearchFacets();
    writePrefsCookie({ mode });
  },
  setSearchMode: (mode: string) => {
    set({ searchMode: mode }, false, 'mode/setSearchMode');
    writePrefsCookie({ searchMode: mode === SearchMode.ADS_COMPAT ? mode : undefined });
  },
  showModeNotice: () => set({ modeNoticeVisible: true }, false, 'mode/showModeNotice'),
  dismissModeNotice: () => set({ modeNoticeVisible: false }, false, 'mode/dismissModeNotice'),
  dismissModeNoticeSilently: () => set({ modeNoticeVisible: false }, false, 'mode/dismissModeNoticeSilently'),
  setUrlModePrevious: (mode) => set({ urlModePrevious: mode }, false, 'mode/setUrlModePrevious'),
  setUrlModeOverride: (mode) => set({ urlModeOverride: mode }, false, 'mode/setUrlModeOverride'),
  setUrlModeUserSelected: (selected) => set({ urlModeUserSelected: selected }, false, 'mode/setUrlModeUserSelected'),
  setUrlModePendingParam: (param) => set({ urlModePendingParam: param }, false, 'mode/setUrlModePendingParam'),
});
