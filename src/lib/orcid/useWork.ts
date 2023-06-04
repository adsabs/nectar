import { useOrcidGetProfile } from '@api/orcid';
import { AppState, useStore } from '@store';
import { isValidIOrcidUser } from '@api/orcid/models';
import { useEffect, useState } from 'react';
import { findWorkInProfile } from '@lib/orcid/helpers';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';

interface IUseWorkProps {
  identifier: string | string[];
  full: boolean;
}

const userSelector = (state: AppState) => state.orcid.user;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;

/**
 * Given an identifier, attempt to match it with the orcid profile.
 *
 * If no match given this will return a null for the `work` param
 */
export const useWork = (props: IUseWorkProps) => {
  const { identifier, full } = props;
  const [work, setWork] = useState<IOrcidProfileEntry | IOrcidProfileEntry['status'] | null>(null);
  const user = useStore(userSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);

  const { data: profile } = useOrcidGetProfile(
    { user, full: true, update: true },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
    },
  );

  useEffect(() => {
    if (profile && identifier) {
      setWork(findWorkInProfile(identifier, profile));
    }
  }, [profile, identifier]);

  return {
    work,
  };
};
