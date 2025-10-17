import { Dispatch, useEffect, useState } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useJournalSearchOptions } from '@/api/journals/journals';
import { useDebounce } from 'use-debounce';
import { splitSearchTerms } from '@/components/SearchBar/helpers';

interface UseJournalSearchProps {
  query: string;
  cursorPosition: number;
  dispatch: Dispatch<SearchInputAction>;
}

const getJournalFieldType = (query: string, cursorPosition: number): 'pub' | 'bibstem' | 'pub_abbrev' | null => {
  // Check for incomplete quoted term at the end first
  const incompleteMatch = query.match(/(pub|bibstem|pub_abbrev):"([^"]*)$/i);
  if (incompleteMatch) {
    const fieldName = incompleteMatch[1].toLowerCase();
    const start = query.length - incompleteMatch[0].length + fieldName.length + ':"'.length;
    const isWithin = cursorPosition >= start && cursorPosition <= query.length;
    return isWithin ? (fieldName as 'pub' | 'bibstem' | 'pub_abbrev') : null;
  }

  const terms = splitSearchTerms(query);
  if (!terms || terms.length === 0) {
    return null;
  }

  const lastTerm = terms[terms.length - 1];
  if (!lastTerm.toLowerCase().match(/^(pub|bibstem|pub_abbrev):"/)) {
    return null;
  }

  const match = lastTerm.match(/(pub|bibstem|pub_abbrev):"([^"]*)"?$/i);
  if (!match) {
    return null;
  }

  const fieldName = match[1].toLowerCase();
  const start = query.length - lastTerm.length + fieldName.length + ':"'.length - 1;
  const end = lastTerm.endsWith('"') ? query.length - 1 : query.length;

  const isWithin = cursorPosition >= start && cursorPosition <= end;
  return isWithin ? (fieldName as 'pub' | 'bibstem' | 'pub_abbrev') : null;
};

const getJournalSearchTerm = (query: string, cursorPosition: number): string => {
  // Check for incomplete quoted term at the end first - support pub, bibstem, and pub_abbrev
  const incompleteMatch = query.match(/(pub|bibstem|pub_abbrev):"([^"]*)$/i);
  if (incompleteMatch) {
    const fieldName = incompleteMatch[1];
    const keyword = incompleteMatch[2];
    const start = query.length - incompleteMatch[0].length + fieldName.length + ':"'.length;
    const isWithin = cursorPosition >= start && cursorPosition <= query.length;
    return isWithin ? keyword : '';
  }

  const terms = splitSearchTerms(query);
  if (!terms || terms.length === 0) {
    return '';
  }

  const lastTerm = terms[terms.length - 1];
  if (!lastTerm.toLowerCase().match(/^(pub|bibstem|pub_abbrev):"/)) {
    return '';
  }

  const match = lastTerm.match(/(pub|bibstem|pub_abbrev):"([^"]*)"?$/i);
  if (!match) {
    return '';
  }

  const fieldName = match[1];
  const keyword = match[2];
  const start = query.length - lastTerm.length + fieldName.length + ':"'.length - 1;
  const end = lastTerm.endsWith('"') ? query.length - 1 : query.length;

  const isWithin = cursorPosition >= start && cursorPosition <= end;
  return isWithin ? keyword : '';
};

export const useJournalSearch = ({ query, cursorPosition, dispatch }: UseJournalSearchProps) => {
  const [journalTerm, setJournalTerm] = useState(() => getJournalSearchTerm(query, cursorPosition));
  const [debouncedTerm] = useDebounce(journalTerm, 200);

  // Detect which field type is being used
  const fieldType = getJournalFieldType(query, cursorPosition);

  const { data } = useJournalSearchOptions({ term: debouncedTerm, fieldType }, { enabled: !!debouncedTerm });

  // Update journalTerm only if it changes
  useEffect(() => {
    const newTerm = getJournalSearchTerm(query, cursorPosition);
    setJournalTerm((prev) => (prev !== newTerm ? newTerm : prev));
  }, [query, cursorPosition]);

  // Dispatch only if the new data is different from the previous
  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    dispatch({ type: 'SET_JOURNAL_TYPEAHEAD_OPTIONS', payload: data });
  }, [data, dispatch]);

  return { fieldType };
};

// Export for testing
export { getJournalSearchTerm, getJournalFieldType };
