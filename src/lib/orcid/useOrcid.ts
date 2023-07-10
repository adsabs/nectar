import { AppState, useStore } from '@store';
import { useIsClient } from '@lib/useIsClient';
import { ORCID_LOGIN_URL } from '@config';
import { useRouter } from 'next/router';
import { useOrcidGetName, useOrcidGetProfile } from '@api/orcid';
import { isValidIOrcidUser } from '@api/orcid/models';
import { useEffect, useState } from 'react';
import { parseAPIError } from '@utils';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: name, ...profileState } = useOrcidGetName(
    { user },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
    },
  );

  const { data: profile, ...nameState } = useOrcidGetProfile(
    { user, full: true, update: true },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
    },
  );

  useEffect(() => {
    setIsLoading(nameState.isLoading || profileState.isLoading);
  }, [nameState.isLoading, profileState.isLoading]);

  useEffect(() => {
    if (nameState.error) {
      setError(parseAPIError(nameState.error));
    }
    if (profileState.error) {
      setError(parseAPIError(profileState.error));
    }
    if (!nameState.error && !profileState.error) {
      setError(null);
    }
  }, [nameState.error, profileState.error]);

  const login = () => {
    if (isClient) {
      location.replace(ORCID_LOGIN_URL);
    }
  };

  const logout = () => {
    // if we're on the orcid page, we need to redirect to the home page
    if (router.pathname === '/user/orcid') {
      void router.replace('/').then(() => {
        reset();
      });
    } else {
      reset();
    }
  };

  const toggleOrcidMode = () => {
    setOrcidMode(!active);
  };

  return {
    active,
    login,
    logout,
    isAuthenticated,
    toggleOrcidMode,
    user,
    name,
    profile,
    isLoading,
    error,
  };
};
