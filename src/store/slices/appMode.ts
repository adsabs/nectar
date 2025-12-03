import { StoreSlice } from '@/store';
import { AppMode } from '@/types';

export interface IAppModeState {
  mode: AppMode;
  modeNoticeVisible: boolean;
  urlModePrevious: AppMode | null;
  urlModeOverride: AppMode | null;
  urlModeUserSelected: boolean;
  urlModePendingParam: string | null;
}

export interface IAppModeAction {
  setMode: (mode: AppMode) => void;
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
  modeNoticeVisible: false,
  urlModePrevious: null,
  urlModeOverride: null,
  urlModeUserSelected: false,
  urlModePendingParam: null,
  setMode: (mode) => {
    set({ mode }, false, 'mode/setMode');

    // on mode change, reset facets
    get().resetSearchFacets();
  },
  showModeNotice: () => set({ modeNoticeVisible: true }, false, 'mode/showModeNotice'),
  dismissModeNotice: () => set({ modeNoticeVisible: false }, false, 'mode/dismissModeNotice'),
  dismissModeNoticeSilently: () => set({ modeNoticeVisible: false }, false, 'mode/dismissModeNoticeSilently'),
  setUrlModePrevious: (mode) => set({ urlModePrevious: mode }, false, 'mode/setUrlModePrevious'),
  setUrlModeOverride: (mode) => set({ urlModeOverride: mode }, false, 'mode/setUrlModeOverride'),
  setUrlModeUserSelected: (selected) => set({ urlModeUserSelected: selected }, false, 'mode/setUrlModeUserSelected'),
  setUrlModePendingParam: (param) => set({ urlModePendingParam: param }, false, 'mode/setUrlModePendingParam'),
});
