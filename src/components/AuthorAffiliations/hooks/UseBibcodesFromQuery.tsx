/** ---------- Hooks ---------- */
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { useSearch } from '@/api/search/search';
import { isIADSSearchParams } from '@/utils/common/guards';
import { isNil, pathOr, pluck } from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';

export const useBibcodesFromQuery = (query: IADSApiSearchParams) => {
  return useSearch(query, {
    enabled: isIADSSearchParams(query),
    useErrorBoundary: true,
    select: (data) => {
      if (isNil(data)) {
        return [];
      }
      const docs = pathOr<IDocsEntity[]>([], ['response', 'docs'], data);
      return isNotNilOrEmpty(docs) ? pluck('bibcode', docs) : [];
    },
  });
};
