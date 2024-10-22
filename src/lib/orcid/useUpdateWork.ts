import { AppState, useStore } from '@/store';
import { useEffect, useState } from 'react';

import { transformADStoOrcid } from '@/lib/orcid/workTransformer';
import { OrcidHookOptions, OrcidMutationOptions } from '@/lib/orcid/types';
import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import { isOrcidProfileEntry } from '@/api/orcid/models';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { useSearch } from '@/api/search/search';
import { useOrcidUpdateWork } from '@/api/orcid/orcid';

const orcidUserSelector = (state: AppState) => state.orcid.user;
export const useUpdateWork = (
  options?: OrcidHookOptions<'updateWork'>,
  mutationOptions?: OrcidMutationOptions<'updateWork'>,
) => {
  const user = useStore(orcidUserSelector);
  const [work, setWork] = useState<IOrcidProfileEntry | null>(null);
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
      enabled: isOrcidProfileEntry(work),
    },
  );

  // setup mutation
  const { mutate: updateWork, ...updateQueryState } = useOrcidUpdateWork(
    { user },
    {
      ...options,
      onSettled: (...args) => {
        if (typeof options.onSettled === 'function') {
          options.onSettled(...args);
        }
        setWork(null);
      },
    },
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

  const onSetWork = (work: IOrcidProfileEntry) => {
    if (isOrcidProfileEntry(work)) {
      return setWork(work);
    }
    throw new Error('Invalid work');
  };

  useEffect(() => {
    if (searchResult && isOrcidProfileEntry(work)) {
      const doc = searchResult?.docs?.[0];
      if (doc) {
        return updateWork({ work: transformADStoOrcid(doc, work.putcode) }, mutationOptions);
      }
      setError('No work found in SCiX');
    }
  }, [searchResult, work, transformADStoOrcid]);

  return {
    updateWork: onSetWork,
    searchQueryState,
    updateQueryState,
    error,
    isLoading: searchQueryState.isLoading || updateQueryState.isLoading,
  };
};
