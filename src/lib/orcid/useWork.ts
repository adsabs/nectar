import { AppState, useStore } from '@/store';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { useEffect, useState } from 'react';
import { findWorkInProfile } from '@/lib/orcid/helpers';
import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import { useOrcidGetProfile } from '@/api/orcid/orcid';

interface IUseWorkProps {
  identifier: string | string[];
  full: boolean;
}

const userSelector = (state: AppState) => state.orcid.user;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;

type UseWorkReturns<T extends IUseWorkProps> = T['full'] extends true
  ? { work: IOrcidProfileEntry }
  : { work: IOrcidProfileEntry['status'] };

/**
 * Given an identifier, attempt to match it with the orcid profile.
 *
 * If no match given this will return a null for the `work` param
 */
export const useWork = <T extends IUseWorkProps>(props: T): UseWorkReturns<T> => {
  const { identifier, full } = props;
  const [work, setWork] = useState<IOrcidProfileEntry | IOrcidProfileEntry['status'] | null>(null);
  const user = useStore(userSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);

  const { data: profile } = useOrcidGetProfile(
    { user, full, update: true },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
    },
  );

  useEffect(() => {
    setWork(findWorkInProfile(identifier, profile));
  }, [profile, identifier, findWorkInProfile]);

  return {
    work,
  } as UseWorkReturns<T>;
};
