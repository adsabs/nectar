import { AppState, useStore } from '@/store';
import { useIsClient } from '@/lib/useIsClient';
import { ORCID_LOGIN_URL, ORCID_MODE_TIMEOUT } from '@/config';
import { useRouter } from 'next/router';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { orcidKeys, useOrcidGetName, useOrcidGetProfile } from '@/api/orcid/orcid';
import { useQueryClient } from '@tanstack/react-query';

const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;
const activeSelector = (state: AppState) => state.orcid.active;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;
const orcidUserSelector = (state: AppState) => state.orcid.user;
const resetSelector = (state: AppState) => state.resetOrcid;
const setNotificationSelector = (state: AppState) => state.setNotification;
const lastActivityAtSelector = (state: AppState) => state.orcid.lastActivityAt;

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

  const queryClient = useQueryClient();

  const isOrcidQueryEnabled = active && isAuthenticated && isValidIOrcidUser(user);
  const profileParams = useMemo(() => ({ user, full: true, update: true }), [user]);

  const { data: name, ...nameState } = useOrcidGetName(
    { user },
    {
      enabled: isOrcidQueryEnabled,
    },
  );

  const { data: profile, ...profileState } = useOrcidGetProfile(profileParams, {
    enabled: isOrcidQueryEnabled,
  });

  // staleTime: Infinity keeps a failed profile cached forever; evict only
  // once disabled, or eviction while enabled just refires the request.
  useEffect(() => {
    if (!isOrcidQueryEnabled && profileState.error) {
      queryClient.removeQueries({ queryKey: orcidKeys.profile(profileParams) });
    }
  }, [isOrcidQueryEnabled, profileState.error, profileParams, queryClient]);

  useEffect(() => {
    if (nameState.error) {
      setError(parseAPIError(nameState.error));
    }
    if (profileState.error) {
      setError(parseAPIError(profileState.error));

      // Cached errors replay on every mount; react only to this mount's fetch.
      if (profileState.isFetchedAfterMount && axios.isAxiosError(profileState.error)) {
        if (profileState.error.response?.status === 401) {
          if (!hasShownSessionExpired.current) {
            setNotification('orcid-session-expired');
            hasShownSessionExpired.current = true;
          }
          logout();
        }
        if (profileState.error.response?.status >= 500) {
          if (toast.isActive('orcid')) {
            return;
          }
          toast({
            status: 'error',
            title: 'Problem connecting with ORCiD',
            description: 'There was an error retrieving your ORCiD profile. Please try again later.',
          });

          toggleOrcidMode(false);
        }
      }
    }
    if (!nameState.error && !profileState.error) {
      setError(null);
    }
  }, [nameState.error, profileState.error, profileState.isFetchedAfterMount]);

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

/**
 * Drives ORCiD mode's sliding-window expiry. Mount once at the app root —
 * `useOrcid` runs in multiple components at once, so a per-hook timer here
 * would fire duplicate toggles and toasts. Stale mode from a past session
 * is cleared separately (and silently) on store rehydration.
 */
export const useOrcidExpiryWatcher = (): void => {
  const active = useStore(activeSelector);
  const lastActivityAt = useStore(lastActivityAtSelector);
  const setOrcidMode = useStore(setOrcidModeSelector);
  const toast = useToast({ id: 'orcid-expiry' });

  useEffect(() => {
    if (!active || lastActivityAt === null) {
      return;
    }

    const remaining = ORCID_MODE_TIMEOUT - (Date.now() - lastActivityAt);
    if (remaining <= 0) {
      setOrcidMode(false);
      return;
    }

    const timer = setTimeout(() => {
      setOrcidMode(false);
      if (!toast.isActive('orcid-expiry')) {
        toast({
          status: 'info',
          title: 'ORCiD mode turned off due to inactivity',
        });
      }
    }, remaining);

    return () => clearTimeout(timer);
    // toast intentionally excluded — useToast's return value isn't
    // referentially stable, and including it would reschedule the timer
    // every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, lastActivityAt, setOrcidMode]);
};
