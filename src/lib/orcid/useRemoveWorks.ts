import { AppState, useStore } from '@store';
import { orcidKeys, useOrcidGetProfile, useOrcidRemoveWorks } from '@api/orcid';
import { useQueryClient } from 'react-query';
import { useEffect, useState } from 'react';
import { isValidIOrcidUser } from '@api/orcid/models';
import { filter, map, path, pipe } from 'ramda';
import { IOrcidProfile } from '@api/orcid/types';
import { OrcidHookOptions, OrcidMutationOptions } from '@lib/orcid/types';

const orcidUserSelector = (state: AppState) => state.orcid.user;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;

export const useRemoveWorks = (
  options?: OrcidHookOptions<'removeWorks'>,
  mutationOptions?: OrcidMutationOptions<'removeWorks'>,
) => {
  const qc = useQueryClient();
  const user = useStore(orcidUserSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);
  const [idsToRemove, setIdsToRemove] = useState<string[]>([]);

  const { data: profile } = useOrcidGetProfile(
    { user },
    { enabled: isAuthenticated && isValidIOrcidUser(user) && idsToRemove.length > 0 },
  );

  const { mutate, ...result } = useOrcidRemoveWorks(
    { user },
    {
      ...options,
      onSettled: async (...args) => {
        if (typeof options?.onSettled === 'function') {
          await options?.onSettled(...args);
        }

        // invalidate cached profile, since it should have been updated
        await qc.invalidateQueries({
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
      mutate({ putcodes: getPutcodesFromProfile(idsToRemove, profile) }, mutationOptions);
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
