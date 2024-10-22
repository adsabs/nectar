import { AppState, useStore } from '@/store';

import { useEffect, useState } from 'react';
import { transformADStoOrcid } from '@/lib/orcid/workTransformer';
import { isValidIOrcidUser } from '@/api/orcid/models';
import { OrcidHookOptions, OrcidMutationOptions } from '@/lib/orcid/types';
import { useQueryClient } from '@tanstack/react-query';
import { orcidKeys, useOrcidAddWorks } from '@/api/orcid/orcid';
import { useSearch } from '@/api/search/search';

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
  const queryKey = orcidKeys.profile({ user, full: true, update: true });

  const result = useOrcidAddWorks(
    { user },
    {
      ...options,
      onSettled: async (...args) => {
        if (typeof options?.onSettled === 'function') {
          options?.onSettled(...args);
        }

        // clear the bibcodes to remove
        setBibcodesToAdd([]);

        // invalidate the profile cache
        await qc.invalidateQueries({
          queryKey,
        });
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
        'orcid_pub',
        'orcid_user',
        'orcid_other',
      ],
      rows: bibcodesToAdd.length,
    },
    {
      enabled: isAuthenticated && isValidIOrcidUser(user) && bibcodesToAdd?.length > 0,
    },
  );

  useEffect(() => {
    // got ads records to add to orcid
    if (searchResult && searchResult.numFound > 0) {
      // transform all the ads records into orcid works
      const works = searchResult.docs.slice(0, bibcodesToAdd.length).map((doc) => transformADStoOrcid(doc));
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
