import { TypeaheadOption } from '@/components/SearchBar/types';
import { matchSorter } from 'match-sorter';
import { logger } from '@/logger';

export const filterItems = (query: string, items: TypeaheadOption[]) => {
  if (/\s+$/.exec(query)) {
    return [];
  }

  const term = extractFinalTerm(query);

  return matchSorter(items, term, { keys: ['match'], threshold: matchSorter.rankings.WORD_STARTS_WITH });
};

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
    logger.error({ error: e }, 'Error extracting final term from query');
    return '';
  }
};

export const updateSearchTerm = (searchTerm: string, value: string) => {
  return searchTerm ? `${searchTerm.replace(/\S+$/, '')}${value}` : value;
};

export const updateUATSearchTerm = (searchTerm: string, value: string) => {
  if (!searchTerm) {
    return value;
  }

  // Remove existing UAT field from anywhere in the query and replace with new value
  // Use similar pattern to journal search but simpler since UAT only has one field type
  const cleaned = searchTerm
    .replace(/^uat:"[^"]+"?$/i, '') // Handle standalone UAT query
    .replace(/^uat:"[^"]+"?\s+/i, '') // Handle UAT at start
    .replace(/\s+uat:"[^"]+"?$/i, ' ') // Handle UAT at end
    .replace(/\s+uat:"[^"]+"?\s+/i, ' '); // Handle UAT in middle

  return cleaned.trim() ? `${cleaned.trim()} uat:${value}` : `uat:${value}`;
};

export const updateJournalSearchTerm = (
  searchTerm: string,
  value: string,
  fieldType?: 'pub' | 'bibstem' | 'pub_abbrev' | null,
) => {
  if (!searchTerm) {
    return value;
  }

  let detectedFieldType = fieldType;

  // If no field type provided, try to detect from the last/current journal field being edited
  if (!detectedFieldType) {
    // Check for incomplete quoted term at the end first (most likely case when typing)
    const incompleteMatch = searchTerm.match(/(pub|bibstem|pub_abbrev):"([^"]*)$/i);
    if (incompleteMatch) {
      detectedFieldType = incompleteMatch[1].toLowerCase() as 'pub' | 'bibstem' | 'pub_abbrev';
    } else {
      // Check for completed terms at the end
      const terms = splitSearchTerms(searchTerm);
      if (terms && terms.length > 0) {
        const lastTerm = terms[terms.length - 1];
        const match = lastTerm.match(/(pub|bibstem|pub_abbrev):"([^"]*)"?$/i);
        if (match) {
          detectedFieldType = match[1].toLowerCase() as 'pub' | 'bibstem' | 'pub_abbrev';
        }
      }
    }
  }

  // If we still couldn't detect the field type, fall back to any journal field found
  if (!detectedFieldType) {
    const fieldMatch = searchTerm.match(/(pub|bibstem|pub_abbrev):"[^"]*"?/i);
    if (!fieldMatch) {
      return value;
    }
    detectedFieldType = fieldMatch[1].toLowerCase() as 'pub' | 'bibstem' | 'pub_abbrev';
  }

  // Find the specific field term to replace based on detected field type
  const fieldToReplace = new RegExp(`(^|\\s)(${detectedFieldType}):"[^"]*"?(?=\\s|$)`, 'i');
  const replacement = `$1${detectedFieldType}:${value}`;

  if (fieldToReplace.test(searchTerm)) {
    return searchTerm.replace(fieldToReplace, replacement);
  }

  // If no specific field found to replace, add the new term
  return searchTerm.trim() ? `${searchTerm.trim()} ${detectedFieldType}:${value}` : `${detectedFieldType}:${value}`;
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
  } else if (searchTerm.endsWith('""?') || searchTerm.endsWith('""*')) {
    return searchTerm.length - 2;
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

export function wrapSelectedWithField(
  input: string,
  selectionStart: number,
  selectionEnd: number,
  fieldTemplate: string,
): string {
  const selectedText = input.slice(selectionStart, selectionEnd).trim();
  const before = input.slice(0, selectionStart);
  const after = input.slice(selectionEnd);
  const hasSelection = selectionStart !== selectionEnd;

  const colonMatch = fieldTemplate.match(/^([a-zA-Z0-9_]+):(.*)$/);
  const funcMatch = fieldTemplate.match(/^([a-zA-Z0-9_]+)\(\)$/);

  // No selection → append raw
  if (!hasSelection) {
    return input + (input ? ' ' : '') + fieldTemplate;
  }

  // Standard field formats
  if (colonMatch) {
    const [, fieldName, wrapper] = colonMatch;
    if (wrapper === '') {
      return `${before}${fieldName}:${selectedText}${after}`;
    }
    if (wrapper === '()') {
      return `${before}${fieldName}:(${selectedText})${after}`;
    }
    if (wrapper === '""') {
      return `${before}${fieldName}:"${selectedText}"${after}`;
    }
    return input + ' ' + fieldTemplate;
  }

  // Function-style
  if (funcMatch) {
    const [, fieldName] = funcMatch;
    return `${before}${fieldName}(${selectedText})${after}`;
  }

  // Operator-based formats
  switch (fieldTemplate) {
    case '""':
      return `${before}"${selectedText}"${after}`;
    case '""*':
      return `${before}"${selectedText}"*${after}`;
    case '=""':
      return `${before}="${selectedText}"${after}`;
    case '""?':
      return `${before}"${selectedText}"?${after}`;
  }

  // Unknown pattern, treat as literal append
  return input + (input ? ' ' : '') + fieldTemplate;
}
