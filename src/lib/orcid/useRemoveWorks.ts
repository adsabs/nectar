import { AppState, useStore } from '@store';
import { orcidKeys, useOrcidGetProfile, useOrcidRemoveWorks } from '@api/orcid';
import { useQueryClient } from 'react-query';
import { useEffect, useState } from 'react';
import { isValidIOrcidUser } from '@api/orcid/models';
import { filter, map, path, pipe } from 'ramda';
import { IOrcidProfile } from '@api/orcid/types';

const orcidUserSelector = (state: AppState) => state.orcid.user;
export const useRemoveWorks = () => {
  const qc = useQueryClient();
  const user = useStore(orcidUserSelector);
  const [idsToRemove, setIdsToRemove] = useState<string[]>([]);

  const { data: profile } = useOrcidGetProfile(
    { user },
    { enabled: isValidIOrcidUser(user) && idsToRemove.length > 0 },
  );

  const { mutate, ...result } = useOrcidRemoveWorks(
    { user },
    {
      onSettled() {
        // invalidate cached profile, since it should have been updated
        void qc.invalidateQueries({
          queryKey: orcidKeys.profile({ user }),
          exact: false,
          refetchActive: true,
        });

        setIdsToRemove([]);
      },
    },
  );

  useEffect(() => {
    if (idsToRemove.length > 0 && profile) {
      mutate({ putcodes: getPutcodesFromProfile(idsToRemove, profile) });
    }
  }, [idsToRemove, profile]);

  return {
    removeWorks: setIdsToRemove,
    ...result,
  };
};

const getPutcodesFromProfile = (ids: string[], profile: IOrcidProfile) => {
  return pipe<[string[]], string[], string[]>(
    filter<string>((id) => Object.hasOwn(profile, id)),
    map((id) => path([id, 'putcode'], profile)),
  )(ids);
};
