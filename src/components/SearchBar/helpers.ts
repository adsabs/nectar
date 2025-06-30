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

export const extractFinalTerm = (query: string): string => {
  try {
    const terms = splitSearchTerms(query);

    // If the query ends in a space or colon + space, assume new term is starting
    if (query.trimEnd().endsWith(':') || query.endsWith(' ')) {
      return '';
    }

    if (terms.length === 0) {
      return '';
    }

    return terms[terms.length - 1];
  } catch (e) {
    return '';
  }
};

export const updateSearchTerm = (searchTerm: string, value: string) => {
  return searchTerm ? `${searchTerm.replace(/\S+$/, '')}${value}` : value;
};

export const updateUATSearchTerm = (searchTerm: string, value: string) => {
  return searchTerm
    ? `${searchTerm.replace(/^uat:"[^"]+"?$/i, '').replace(/\s+uat:"[^"]+"?$/i, ' ')}uat:${value}`
    : value;
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

export function splitSearchTerms(input: string): string[] {
  const results: string[] = [];

  const regex = /"[^"]*"|\([^)"]*(?:"[^"]*"[^)]*)*\)|\S+:\([^)"]*(?:"[^"]*"[^)]*)*\)|\S+:"[^"]*"|\S+/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    const token = match[0].trim();
    if (token) {
      results.push(token);
    }
  }

  return results;
}
