import { StoreSlice } from '@store';
import { IOrcidUser } from '@api/orcid/types';
import { isValidIOrcidUser } from '@api/orcid/models';

export interface IORCIDState {
  orcid: {
    isAuthenticated: boolean;
    user: IOrcidUser | null;
    active: boolean;
  };
}

export interface IORCIDAction {
  setOrcidUser: (user: IOrcidUser) => void;
  setOrcidMode: (active: boolean) => void;
  resetOrcid: () => void;
}

const initialState: IORCIDState['orcid'] = {
  isAuthenticated: false,
  user: null,
  active: false,
};

export const orcidSlice: StoreSlice<IORCIDState & IORCIDAction> = (set, get) => ({
  orcid: initialState,
  setOrcidUser: (user) => {
    if (isValidIOrcidUser(user)) {
      return set((state) => ({
        orcid: { ...state.orcid, user, isAuthenticated: true },
      }));
    }
    return set((state) => ({
      orcid: { ...state.orcid, isAuthenticated: false, user: null, active: false },
    }));
  },
  setOrcidMode: (active) => {
    if (get().orcid.isAuthenticated) {
      set((state) => ({
        orcid: { ...state.orcid, active },
      }));
    }
  },
  resetOrcid: () => set({ orcid: initialState }),
});