import { curry } from 'ramda';
import { TypeaheadOption } from '@/components/SearchBar/types';
import { matchSorter } from 'match-sorter';

export const filterItems = curry((query: string, items: TypeaheadOption[]) => {
  if (/\s+$/.exec(query)) {
    return [];
  }

  const term = extractFinalTerm(query);

  return matchSorter(items, term, { keys: ['match'], threshold: matchSorter.rankings.WORD_STARTS_WITH });
});

export const extractFinalTerm = (query: string) => {
  // detect fields, and return the last field
  const fields = query.match(/(?:[^\s"]+|"[^"]*")+/g);

  if (fields !== null && fields.length > 1) {
    // if query is a field with no value, return empty string
    if (query.endsWith(': ')) {
      return '';
    }

    return fields[fields.length - 1];
  }

  // if query ends with a space, return empty string
  if (query.endsWith(' ')) {
    return '';
  }

  return query;
};

export const updateSearchTerm = (searchTerm: string, value: string) => {
  return searchTerm ? `${searchTerm.replace(/\S+$/, '')}${value}` : value;
};

export const appendSearchTerm = (searchTerm: string, value: string) => {
  return searchTerm.length > 0 ? `${searchTerm} ${value}` : value;
};

export const getCursorPosition = (searchTerm: string) => {
  // if the final character in the search term is an empty set of quotes, parens, or brackets - move the cursor to the inside
  if (
    searchTerm.endsWith(`""`) ||
    searchTerm.endsWith(`"^"`) ||
    searchTerm.endsWith(`()`) ||
    searchTerm.endsWith(`[]`)
  ) {
    return searchTerm.length - 1;
  }
  return searchTerm.length;
};

export const getFocusedItemValue = (items: TypeaheadOption[], focused: number) => {
  if (focused === -1 || focused >= items.length) {
    return null;
  }
  return items[focused].value;
};

export const getPreview = (searchTerm: string, value: string | null) => {
  if (value === null) {
    return searchTerm;
  }
  return updateSearchTerm(searchTerm, value);
};
