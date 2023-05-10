import { AppState, useStore } from '@store';
import { useIsClient } from '@hooks/useIsClient';
import { ORCID_LOGIN_URL } from '@config';
import { useRouter } from 'next/router';

const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;
const activeSelector = (state: AppState) => state.orcid.active;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;
const orcidUserSelector = (state: AppState) => state.orcid.user;
const resetSelector = (state: AppState) => state.resetOrcid;

export const useOrcid = () => {
  const router = useRouter();
  const setOrcidMode = useStore(setOrcidModeSelector);
  const isClient = useIsClient();
  const active = useStore(activeSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);
  const reset = useStore(resetSelector);
  const user = useStore(orcidUserSelector);

  const login = () => {
    if (isClient) {
      location.replace(ORCID_LOGIN_URL);
    }
  };

  const logout = () => {
    reset();
    if (router.pathname === '/user/orcid') {
      void router.replace('/');
    }
  };

  return {
    active,
    login,
    logout,
    isAuthenticated,
    toggleOrcidMode: () => setOrcidMode(!active),
    user,
  };
};
