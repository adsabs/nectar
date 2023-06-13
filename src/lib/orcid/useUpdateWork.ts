import { AppState, useStore } from '@store';
import { useOrcidUpdateWork } from '@api/orcid';
import { useEffect, useState } from 'react';
import { useSearch } from '@api';
import { transformADStoOrcid } from '@lib/orcid/workTransformer';
import { OrcidHookOptions, OrcidMutationOptions } from '@lib/orcid/types';
import { parseAPIError } from '@utils';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { isOrcidProfileEntry } from '@api/orcid/models';

const orcidUserSelector = (state: AppState) => state.orcid.user;
export const useUpdateWork = (
  options?: OrcidHookOptions<'updateWork'>,
  mutationOptions?: OrcidMutationOptions<'updateWork'>,
) => {
  const user = useStore(orcidUserSelector);
  const [work, setWork] = useState<IOrcidProfileEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ADS record
  const { data: searchResult, ...searchQueryState } = useSearch(
    {
      q: `identifier:${work?.identifier}`,
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
      rows: 1,
    },
    {
      enabled: !!work,
      onError: (error) => setError(parseAPIError(error)),
    },
  );

  // setup mutation
  const { mutate: updateWork, ...updateQueryState } = useOrcidUpdateWork(
    { user },
    {
      ...options,
      onSettled: async (...args) => {
        if (typeof options.onSettled === 'function') {
          await options.onSettled(...args);
        }
        setWork(null);
      },
    },
  );

  // update loading state
  useEffect(
    () => setIsLoading(searchQueryState.isLoading || updateQueryState.isLoading),
    [searchQueryState.isLoading, updateQueryState.isLoading],
  );

  // update error state
  useEffect(() => {
    if (searchQueryState.error) {
      return setError(parseAPIError(searchQueryState.error));
    }
    if (updateQueryState.error) {
      return setError(parseAPIError(updateQueryState.error));
    }
    return setError(null);
  }, [searchQueryState.error, updateQueryState.error]);

  // run mutation
  useEffect(() => {
    if (searchResult && isOrcidProfileEntry(work)) {
      const doc = searchResult?.docs?.[0];
      if (doc) {
        return updateWork({ work: transformADStoOrcid(doc, work.putcode) }, mutationOptions);
      }
    }
  }, [searchResult, work, transformADStoOrcid]);

  return {
    updateWork: setWork,
    searchQueryState,
    updateQueryState,
    error,
    isLoading,
  };
};
