import { AppState, StoreSlice } from '@store';
import { Theme } from '@types';
import { NamedSet } from 'zustand/middleware';

export interface IAppStateThemeSlice {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const themeSlice: StoreSlice<IAppStateThemeSlice> = (set: NamedSet<AppState>) => ({
  theme: Theme.GENERAL,
  setTheme: (theme: Theme) => set({ theme }, false, 'theme/setTheme'),
});
