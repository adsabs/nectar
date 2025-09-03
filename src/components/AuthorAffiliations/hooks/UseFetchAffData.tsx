import { IADSApiSearchParams } from '@/api/search/types';
import { useAuthorAffStore } from '@/components/AuthorAffiliations/store';
import { useAuthorAffiliationSearch } from '@/api/author-affiliation/author-affiliation';
import { getAuthorAffiliationSearchParams } from '@/api/author-affiliation/model';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { useEffect } from 'react';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { errorMessages } from '@/components/AuthorAffiliations/ErrorMessage';
import { useBibcodesFromQuery } from '@/components/AuthorAffiliations/hooks/UseBibcodesFromQuery';
import { AffTableState } from '@/components/AuthorAffiliations';

export const useFetchAffData = (query: IADSApiSearchParams, formState: AffTableState) => {
  const setItems = useAuthorAffStore((s) => s.setItems);
  const setIsLoading = useAuthorAffStore((s) => s.setIsLoading);

  const { data: bibcode } = useBibcodesFromQuery(query);

  const {
    data: items,
    isLoading,
    error,
    isError,
  } = useAuthorAffiliationSearch(
    getAuthorAffiliationSearchParams({ maxauthor: [formState.maxAuthors], numyears: [formState.numYears], bibcode }),
    { enabled: isNotNilOrEmpty(bibcode) },
  );

  // sync store with query result
  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    if (isNotNilOrEmpty(items)) {
      setItems(items);

      // TODO: (refactor) this will be unnecessary when the service returns empty array instead of error
    } else if (isError && parseAPIError(error) === errorMessages.noResults) {
      setItems([]);
    }
  }, [error, isError, items, setItems]);

  return { isLoading, error, isError };
};
