import { AppState, useStore } from '@store';
import { orcidKeys, useOrcidAddWorks } from '@api/orcid';
import { useSearch } from '@api';
import { useEffect, useState } from 'react';
import { transformADStoOrcid } from '@lib/orcid/workTransformer';
import { useQueryClient } from 'react-query';
import { isValidIOrcidUser } from '@api/orcid/models';
import { OrcidHookOptions, OrcidMutationOptions } from '@lib/orcid/types';

const orcidUserSelector = (state: AppState) => state.orcid.user;
const isAuthenticatedSelector = (state: AppState) => state.orcid.isAuthenticated;

export const useAddWorks = (
  options?: OrcidHookOptions<'addWorks'>,
  mutationOptions?: OrcidMutationOptions<'addWorks'>,
) => {
  const qc = useQueryClient();
  const user = useStore(orcidUserSelector);
  const isAuthenticated = useStore(isAuthenticatedSelector);
  const [bibcodesToAdd, setBibcodesToAdd] = useState<string[]>([]);

  const result = useOrcidAddWorks(
    { user },
    {
      ...options,
      onSettled: async (...args) => {
        if (typeof options?.onSettled === 'function') {
          await options?.onSettled(...args);
        }

        setBibcodesToAdd([]);
      },
      onSuccess: async (data, ...args) => {
        if (typeof options?.onSuccess === 'function') {
          await options?.onSuccess(data, ...args);
        }
        // invalidate cached profile, since it should have been updated
        await qc.invalidateQueries({
          queryKey: orcidKeys.profile({ user, full: true, update: true }),
          refetchActive: true,
        });

        // TODO: be able to push on a new record to use instead of refetching (this isn't working)
        // qc.setQueryData<IOrcidProfile>(orcidKeys.profile({ user, full: true, update: true }), (profile) => {
        //   const newProfile: IOrcidProfile = {};
        //   if (data?.bulk) {
        //     data.bulk.forEach((entry) => {
        //       const ids = view(orcidLenses.externalId, entry?.work);
        //       const id = view(orcidLenses.externalIdValue, ids?.[0]);
        //
        //       if (typeof id === 'string' && !Object.hasOwn(profile, id)) {
        //         newProfile[id] = {
        //           status: 'pending',
        //           identifier: id,
        //           source: [ORCID_ADS_SOURCE_NAME],
        //           putcode: view(orcidLenses.putCode, entry?.work),
        //           pubmonth: view(orcidLenses.publicationDateMonth, entry?.work),
        //           pubyear: view(orcidLenses.publicationDateYear, entry?.work),
        //           title: view(orcidLenses.title, entry?.work),
        //           updated: formatISO(new Date(), { format: 'extended' }),
        //         };
        //       }
        //     });
        //   }
        //   console.log({ profile, newProfile });
        //
        //   return { ...profile, ...newProfile };
        // });
      },
    },
  );

  const { data: searchResult, isLoading: isSearchLoading } = useSearch(
    {
      q: `identifier:(${bibcodesToAdd?.join(' OR ')})`,
      fl: [
        'pubdate',
        'abstract',
        'bibcode',
        'alternate_bibcode',
        'pub',
        'doi',
        '[fields doi=1]',
        'author',
        'title',
        '[fields title=1]',
        'doctype',
        'identifier',
      ],
      rows: 99999,
    },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user) && bibcodesToAdd?.length > 0,
    },
  );

  useEffect(() => {
    // got ads records to add to orcid
    if (searchResult && searchResult.numFound > 0) {
      // transform all the ads records into orcid works
      const works = searchResult.docs.map(transformADStoOrcid);
      // finally sync the works with orcid
      result.mutate({ works }, mutationOptions);
    }
  }, [searchResult]);

  return {
    addWorks: setBibcodesToAdd,
    isLoading: isSearchLoading && result.isLoading,
    ...result,
  };
};
