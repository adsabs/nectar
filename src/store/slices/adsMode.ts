import { StoreSlice } from '@/store';

export interface IAdsModeState {
  adsMode: {
    active: boolean;
  };
}

export interface IAdsModeAction {
  setAdsMode: (active: boolean) => void;
}

const initialState: IAdsModeState['adsMode'] = {
  active: false,
};

export const adsModeSlice: StoreSlice<IAdsModeState & IAdsModeAction> = (set) => ({
  adsMode: initialState,
  // ADS Mode is temporarily disabled - always force to false
  setAdsMode: () => set(() => ({ adsMode: { active: false } }), false, 'adsMode/setAdsMode'),
});
