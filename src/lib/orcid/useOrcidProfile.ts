import { AppState, useStore } from '@store';
import { useOrcidGetProfile } from '@api/orcid';
import { isValidIOrcidUser } from '@api/orcid/models';

const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;
const orcidUserSelector = (state: AppState) => state.orcid.user;

export const useOrcidProfile = (options?: Parameters<typeof useOrcidGetProfile>[1]) => {
  const isAuthenticated = useStore(isAuthenticatedSelector);
  const user = useStore(orcidUserSelector);

  const { data: profile, ...result } = useOrcidGetProfile(
    { user, full: true, update: true },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
      ...options,
    },
  );

  return {
    profile,
    ...result,
  };
};
