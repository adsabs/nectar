import { Dispatch, useEffect, useState } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useUATTermsSearchOptions } from '@/api/uat/uat';
import { useDebounce } from 'use-debounce';
import { splitSearchTerms } from '@/components/SearchBar/helpers';

interface UseUATSearchProps {
  query: string;
  cursorPosition: number;
  dispatch: Dispatch<SearchInputAction>;
}

const getUATSearchTerm = (query: string, cursorPosition: number): string => {
  const terms = splitSearchTerms(query);
  if (!terms || terms.length === 0) {
    return '';
  }

  const lastTerm = terms[terms.length - 1];
  if (!lastTerm.toLowerCase().startsWith('uat:"')) {
    return '';
  }

  const match = lastTerm.match(/uat:"([^"]*)"?$/i);
  if (!match || !match[1]) {
    return '';
  }

  const keyword = match[1];
  const start = query.length - lastTerm.length + 'uat:"'.length - 1;
  const end = lastTerm.endsWith('"') ? query.length - 1 : query.length;

  const isWithin = cursorPosition >= start && cursorPosition <= end;
  return isWithin ? keyword : '';
};

export const useUATSearch = ({ query, cursorPosition, dispatch }: UseUATSearchProps) => {
  const [uatTerm, setUatTerm] = useState(() => getUATSearchTerm(query, cursorPosition));
  const [debouncedTerm] = useDebounce(uatTerm, 200);
  const { data } = useUATTermsSearchOptions({ term: debouncedTerm }, { enabled: !!debouncedTerm });

  // Update uatTerm only if it changes
  useEffect(() => {
    const newTerm = getUATSearchTerm(query, cursorPosition);
    setUatTerm((prev) => (prev !== newTerm ? newTerm : prev));
  }, [query, cursorPosition]);

  // Dispatch only if the new data is different from the previous
  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    dispatch({ type: 'SET_UAT_TYPEAHEAD_OPTIONS', payload: data });
    setUatTerm('');
  }, [data, dispatch]);
};
