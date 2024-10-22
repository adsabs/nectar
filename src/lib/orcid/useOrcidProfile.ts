import { AppState, useStore } from '@/store';

import { useEffect, useState } from 'react';
import { IOrcidProfile } from '@/api/orcid/types';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { mergeOrcidMissingRecords } from '@/lib/orcid/helpers';
import { useSearch } from '@/api/search/search';
import { useOrcidGetProfile } from '@/api/orcid/orcid';
import { getSearchParams } from '@/api/search/models';

const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;
const orcidUserSelector = (state: AppState) => state.orcid.user;

interface IUseOrcidProfileProps {
  profileOnly?: boolean;
}

export const useOrcidProfile = (
  props?: IUseOrcidProfileProps,
  options?: {
    searchOptions: Parameters<typeof useSearch>[1];
    profileOptions: Parameters<typeof useOrcidGetProfile>[1];
  },
) => {
  const isAuthenticated = useStore(isAuthenticatedSelector);
  const user = useStore(orcidUserSelector);
  const { profileOnly = false } = props;
  const [profile, setProfile] = useState<IOrcidProfile>({});

  const profileResponse = useOrcidGetProfile(
    {
      user,
      full: true,
      update: true,
    },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user),
      ...options?.profileOptions,
    },
  );

  const searchParams = getSearchParams({
    q: `orcid_pub:${user?.orcid} -orcid_user:${user?.orcid} -orcid_other:${user?.orcid}`,
    fl: ['identifier', 'title', 'pubdate'],
    rows: 99999,
  });
  const searchResponse = useSearch(searchParams, {
    enabled: !profileOnly && isAuthenticated && isValidIOrcidUser(user),
    ...options?.searchOptions,
  });

  useEffect(() => {
    if (profileOnly && profileResponse.data) {
      setProfile(profileResponse.data);
    } else if (profileResponse.data && searchResponse.data) {
      setProfile(mergeOrcidMissingRecords(searchResponse.data?.docs, profileResponse.data));
    }
  }, [profileOnly, profileResponse.data, searchResponse.data]);

  return {
    profile,
    isLoading: profileResponse.isLoading || searchResponse.isLoading,
  };
};
