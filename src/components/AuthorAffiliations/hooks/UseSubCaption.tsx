import { useMemo } from 'react';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { AffTableState } from '@/components/AuthorAffiliations/AuthorAffiliations';

export const useSubCaption = (state: AffTableState) => {
  return useMemo(() => {
    if (!state) {
      return null;
    }
    const { maxAuthors, numYears } = state;
    const currentYear = new Date().getFullYear();
    const parts: string[] = [];

    if (numYears !== null && numYears !== undefined) {
      parts.push(numYears === 0 ? 'All years' : `From ${currentYear - numYears} to ${currentYear}`);
    }
    if (maxAuthors !== null && maxAuthors !== undefined) {
      parts.push(`${maxAuthors === 0 ? 'All' : maxAuthors} author${maxAuthors !== 1 ? 's' : ''} from each work`);
    }
    return parts.join(' | ');
  }, [state]);
};
