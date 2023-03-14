import { StoreSlice } from '@store';
import { Theme } from '@types';

export interface IThemeState {
  theme: Theme;
}

export interface IThemeAction {
  setTheme: (theme: Theme) => void;
}

export const themeSlice: StoreSlice<IThemeState & IThemeAction> = (set) => ({
  theme: Theme.GENERAL,
  setTheme: (theme) => {
    set({ theme }, false, 'theme/setTheme');
    set((state) => state.updateSearchFacetsByTheme(), false, 'theme/updateSearchFacetsByTheme');
  },
});
