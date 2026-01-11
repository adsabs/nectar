import { AppState, useStore } from '@/store';
import { useIsClient } from '@/lib/useIsClient';
import { ORCID_LOGIN_URL } from '@/config';
import { useRouter } from 'next/router';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { useOrcidGetName, useOrcidGetProfile } from '@/api/orcid/orcid';

const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;
const activeSelector = (state: AppState) => state.orcid.active;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;
const orcidUserSelector = (state: AppState) => state.orcid.user;
const resetSelector = (state: AppState) => state.resetOrcid;
const setNotificationSelector = (state: AppState) => state.setNotification;

export const useOrcid = () => {
  const router = useRouter();
  const setOrcidMode = useStore(setOrcidModeSelector);
  const isClient = useIsClient();
  const active = useStore(activeSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);
  const reset = useStore(resetSelector);
  const user = useStore(orcidUserSelector);
  const setNotification = useStore(setNotificationSelector);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast({ id: 'orcid' });
  const hasShownSessionExpired = useRef(false);

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
        if (profileState.error.response?.status === 401) {
          // Show session expired warning only once
          if (!hasShownSessionExpired.current) {
            setNotification('orcid-session-expired');
            hasShownSessionExpired.current = true;
          }
          logout();
        }
        // TODO: figure out why this runs even when orcid mode is off
        if (profileState.error.response?.status >= 500) {
          // prevent duplicate toasts
          if (toast.isActive('orcid')) {
            return;
          }
          toast({
            status: 'error',
            title: 'Problem connecting with ORCiD',
            description:
              'There was an error retrieving your ORCiD profile. Please try again later.',
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

  // Reset the session expired flag when user authenticates again
  useEffect(() => {
    if (isAuthenticated) {
      hasShownSessionExpired.current = false;
    }
  }, [isAuthenticated]);

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
