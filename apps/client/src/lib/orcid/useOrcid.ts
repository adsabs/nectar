import { AppState, useStore } from '@/store';
import { useIsClient } from '@/lib/useIsClient';
import { ORCID_LOGIN_URL } from '@/config';
import { useRouter } from 'next/router';
import { useOrcidGetName, useOrcidGetProfile } from '@/api/orcid';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { useEffect, useState } from 'react';
import { parseAPIError } from '@/utils';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';

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
  const [error, setError] = useState<string | null>(null);
  const toast = useToast({ id: 'orcid' });

  const { data: name, ...nameState } = useOrcidGetName(
    { user },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
    },
  );

  const { data: profile, ...profileState } = useOrcidGetProfile(
    { user, full: true, update: true },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
    },
  );

  useEffect(() => {
    if (nameState.error) {
      setError(parseAPIError(nameState.error));
    }
    if (profileState.error) {
      setError(parseAPIError(profileState.error));

      // handle ORCiD session expired or ORCiD error
      if (axios.isAxiosError(profileState.error)) {
        // prevent duplicate toasts
        if (toast.isActive('orcid')) {
          return;
        }

        if (profileState.error.response?.status === 401) {
          toast({
            status: 'error',
            title: 'ORCiD Session Expired',
            description: 'Your ORCID session has expired. Please log in again.',
          });
          logout();
        }
        if (profileState.error.response?.status >= 500) {
          toast({
            status: 'error',
            title: 'Problem connecting with ORCiD',
            description: 'There was an error retrieving your ORCiD profile. Please try again later.',
          });

          // toggle orcid mode off
          toggleOrcidMode(false);
        }
      }
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
    if (router.pathname === '/user/orcid' || router.pathname === '/user/orcid/OAuth') {
      router.replace('/').finally(() => {
        reset();
      });
    } else {
      reset();
    }
  };

  const toggleOrcidMode = (mode?: boolean) => {
    setOrcidMode(typeof mode === 'boolean' ? mode : !active);
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
    isLoading: nameState.isLoading || profileState.isLoading,
    error,
  };
};
