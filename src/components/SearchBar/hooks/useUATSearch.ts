import { Dispatch, useEffect, useRef, useState } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useUATTermsSearchOptions } from '@/api/uat/uat';
import { useDebounce } from 'use-debounce';

interface UseUATSearchProps {
  query: string;
  cursorPosition: number;
  dispatch: Dispatch<SearchInputAction>;
}

const getUATSearchTerm = (query: string, cursorPosition: number): string => {
  if (!query) {
    return '';
  }

  const matches = Array.from(query.matchAll(/uat:"([^"]*)"?/gi));

  if (matches.length === 0) {
    return '';
  }

  for (const match of matches) {
    const [fullMatch, value = ''] = match;
    const matchIndex = match.index ?? 0;
    const valueStart = matchIndex + 'uat:"'.length;
    const hasClosingQuote = fullMatch.endsWith('"');
    const valueEnd = hasClosingQuote ? matchIndex + fullMatch.length - 1 : query.length;

    if (cursorPosition >= valueStart && cursorPosition <= valueEnd) {
      return value;
    }
  }

  return '';
};

export const useUATSearch = ({ query, cursorPosition, dispatch }: UseUATSearchProps) => {
  const [uatTerm, setUatTerm] = useState(() => getUATSearchTerm(query, cursorPosition));
  const [debouncedTerm] = useDebounce(uatTerm, 200);
  const { data } = useUATTermsSearchOptions({ term: debouncedTerm }, { enabled: !!debouncedTerm });
  const lastDispatchedTerm = useRef<string | null>(null);

  // Update uatTerm only if it changes
  useEffect(() => {
    const newTerm = getUATSearchTerm(query, cursorPosition);
    setUatTerm((prev) => (prev !== newTerm ? newTerm : prev));
  }, [query, cursorPosition]);

  // Dispatch only if the new data is different from the previous
  useEffect(() => {
    if (!debouncedTerm) {
      lastDispatchedTerm.current = null;
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    if (lastDispatchedTerm.current === debouncedTerm) {
      return;
    }

    dispatch({ type: 'SET_UAT_TYPEAHEAD_OPTIONS', payload: data });
    lastDispatchedTerm.current = debouncedTerm;
    setUatTerm('');
  }, [data, debouncedTerm, dispatch]);
};
