import { StoreSlice } from '@/store';
import { IOrcidUser } from '@/api/orcid/types';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { ORCID_MODE_TIMEOUT } from '@/config';

export interface IORCIDState {
  orcid: {
    isAuthenticated: boolean;
    user: IOrcidUser | null;
    active: boolean;
    // timestamp (ms) of the last ORCiD activity; drives the sliding-window
    // inactivity expiry. `null` when mode is off.
    lastActivityAt: number | null;
  };
}

export interface IORCIDAction {
  setOrcidUser: (user: IOrcidUser) => void;
  setOrcidMode: (active: boolean) => void;
  resetOrcid: () => void;
  // resets the inactivity window; no-op when mode is off
  touchOrcidActivity: () => void;
}

const initialState: IORCIDState['orcid'] = {
  isAuthenticated: false,
  user: null,
  active: false,
  lastActivityAt: null,
};

/** Whether `lastActivityAt` is older than the ORCiD mode timeout. `null` is never stale. */
export const isOrcidActivityStale = (lastActivityAt: number | null): boolean => {
  if (lastActivityAt === null) {
    return false;
  }
  return Date.now() - lastActivityAt > ORCID_MODE_TIMEOUT;
};

export const orcidSlice: StoreSlice<IORCIDState & IORCIDAction> = (set) => ({
  orcid: initialState,
  setOrcidUser: (user) => {
    if (isValidIOrcidUser(user)) {
      return set((state) => ({
        orcid: { ...state.orcid, user, isAuthenticated: true, active: true, lastActivityAt: Date.now() },
      }));
    }
    return set((state) => ({
      orcid: { ...state.orcid, isAuthenticated: false, user: null, active: false, lastActivityAt: null },
    }));
  },
  setOrcidMode: (active) => {
    return set((state) => ({
      orcid: { ...state.orcid, active, lastActivityAt: active ? Date.now() : null },
    }));
  },
  resetOrcid: () => set({ orcid: initialState }),
  touchOrcidActivity: () => {
    return set((state) => (state.orcid.active ? { orcid: { ...state.orcid, lastActivityAt: Date.now() } } : state));
  },
});
