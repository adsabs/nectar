import { AppState, useStore } from '@store';
import { orcidKeys, useOrcidAddWorks } from '@api/orcid';
import { useSearch } from '@api';
import { useEffect, useState } from 'react';
import { transformADStoOrcid } from '@lib/orcid/workTransformer';
import { useQueryClient } from 'react-query';

const orcidUserSelector = (state: AppState) => state.orcid.user;
export const useAddWorks = () => {
  const qc = useQueryClient();
  const user = useStore(orcidUserSelector);
  const [bibcodesToAdd, setBibcodesToAdd] = useState<string[]>([]);

  const result = useOrcidAddWorks(
    { user },
    {
      onSettled: () => {
        setBibcodesToAdd([]);
      },
      onSuccess: () => {
        // invalidate cached profile, since it should have been updated
        void qc.invalidateQueries({
          queryKey: orcidKeys.profile({ user }),
          exact: false,
          refetchActive: true,
        });
      },
    },
  );

  const { data: searchResult } = useSearch(
    {
      q: `identifier:(${bibcodesToAdd.join(' OR ')})`,
      fl: [
        'pubdate',
        'abstract',
        'bibcode',
        'pub',
        'doi',
        '[fields doi=1]',
        'author',
        'title',
        '[fields title=1]',
        'doctype',
        'identifier',
      ],
    },
    {
      enabled: bibcodesToAdd.length > 0,
    },
  );

  useEffect(() => {
    // got ads records to add to orcid
    if (searchResult && searchResult.numFound > 0) {
      // transform all the ads records into orcid works
      const works = searchResult.docs.map(transformADStoOrcid);

      // finally sync the works with orcid
      result.mutate({ works });
    }
  }, [searchResult]);

  const addWorks = ({ bibcodes }: { bibcodes: string[] }) => {
    setBibcodesToAdd(bibcodes);
  };

  return {
    addWorks,
    ...result,
  };
};
