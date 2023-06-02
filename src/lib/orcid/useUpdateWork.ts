import { AppState, useStore } from '@store';
import { useOrcidGetProfile, useOrcidGetWork, useOrcidUpdateWork } from '@api/orcid';
import { useEffect, useState } from 'react';
import { isString } from 'ramda-adjunct';
import { isOrcidProfileEntry, isValidIOrcidUser } from '@api/orcid/models';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';

const orcidUserSelector = (state: AppState) => state.orcid.user;
export const useUpdateWork = () => {
  const user = useStore(orcidUserSelector);
  const [id, setId] = useState<string | null>(null);
  const [profileEntry, setProfileEntry] = useState<IOrcidProfileEntry | null>(null);
  const { data: profile } = useOrcidGetProfile(
    { user },
    {
      enabled: isValidIOrcidUser(user) && isString(id),
    },
  );

  if (profile && Object.hasOwn(profile, id) && isOrcidProfileEntry(profile[id])) {
    setProfileEntry(profile[id]);
  }

  const { data: work } = useOrcidGetWork(
    {
      user,
      putcode: profileEntry?.putcode,
    },
    {
      enabled: isOrcidProfileEntry(profile?.[id]),
    },
  );

  // TODO: merge the work with the ADS record
  // have to fetch ADS record via search identifier:xxx

  const result = useOrcidUpdateWork({ user });

  useEffect(() => {
    console.log('work', work);
  }, [work]);

  useEffect(() => {
    console.log('result', result.data);
  }, [result]);

  return {
    updateWork: setId,
    ...result,
  };
};
