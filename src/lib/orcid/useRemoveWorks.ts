import { AppState, useStore } from '@store';
import { orcidKeys, useOrcidGetProfile, useOrcidRemoveWorks } from '@api/orcid';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { isValidIOrcidUser } from '@api/orcid/models';
import { filter, keys, map, path, pipe, propEq } from 'ramda';
import { IOrcidProfile } from '@api/orcid/types';
import { OrcidMutationOptions } from '@lib/orcid/types';

const orcidUserSelector = (state: AppState) => state.orcid.user;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;

export const useRemoveWorks = (
  mutationOptions: OrcidMutationOptions<'removeWorks'>,
  options?: {
    getProfileOptions?: Parameters<typeof useOrcidGetProfile>[1];
    removeWorksOptions?: Parameters<typeof useOrcidRemoveWorks>[1];
  },
) => {
  const qc = useQueryClient();
  const user = useStore(orcidUserSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);
  const [idsToRemove, setIdsToRemove] = useState<string[]>([]);

  const { data: profile } = useOrcidGetProfile(
    { user, full: true, update: true },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user) && idsToRemove.length > 0,
      ...options?.getProfileOptions,
    },
  );

  const { mutate, ...result } = useOrcidRemoveWorks(
    { user },
    {
      ...options?.removeWorksOptions,
      retry: false,
      onSettled: async (data, ...args) => {
        if (typeof options?.removeWorksOptions?.onSettled === 'function') {
          options?.removeWorksOptions?.onSettled(data, ...args);
        }

        const deleted = getFulfilled(data);

        if (deleted.length > 0 && isValidIOrcidUser(user)) {
          const queryKey = orcidKeys.profile({ user, full: true, update: true });
          const match = qc.getQueryCache().find(queryKey, { type: 'active' });
          let invalidate = false;
          if (match) {
            qc.setQueryData<IOrcidProfile>(queryKey, (currentProfile) => {
              const profile = { ...currentProfile };
              for (const putcode of deleted) {
                // find the entry in the profile and delete it
                const id = findPutcodeInProfile(putcode, profile);
                if (id) {
                  delete profile[id];
                } else {
                  // if we can't find the work in the profile, invalidate the cache
                  invalidate = true;
                }
              }
              return profile;
            });
          }
          if (!match || invalidate) {
            // invalidate cached profile, since it should have been updated
            await qc.invalidateQueries({
              queryKey,
            });
          }
        }

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

export const findPutcodeInProfile = (putcode: string, profile: IOrcidProfile) => {
  return keys(filter((entry) => Number(entry.putcode) === Number(putcode), profile))[0];
};

type OrcidDeleteResponse = Record<string, PromiseSettledResult<void>>;

export const getFulfilled = (entries: OrcidDeleteResponse) => {
  return pipe<[OrcidDeleteResponse], OrcidDeleteResponse, string[]>(
    filter(propEq('status', 'fulfilled')),
    keys,
  )(entries);
};

export const getRejected = (entries: OrcidDeleteResponse) => {
  return pipe<[OrcidDeleteResponse], OrcidDeleteResponse, string[]>(
    filter(propEq('status', 'rejected')),
    keys,
  )(entries);
};
