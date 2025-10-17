import { describe, expect, test } from 'vitest';

// Mock the getJournalSearchTerm function from useJournalSearch
const getJournalSearchTerm = (query: string, cursorPosition: number): string => {
  // Check for incomplete quoted term at the end first
  const incompleteMatch = query.match(/pub:"([^"]*)$/i);
  if (incompleteMatch) {
    const keyword = incompleteMatch[1];
    const start = query.length - incompleteMatch[0].length + 'pub:"'.length;
    const isWithin = cursorPosition >= start && cursorPosition <= query.length;
    return isWithin ? keyword : '';
  }

  // Split query into terms using the same logic as UAT search
  const terms =
    query.match(/"[^"]*"|\([^)"]*(?:"[^"]*"[^)]*)*\)|\S+:\([^)"]*(?:"[^"]*"[^)]*)*\)|\S+:"[^"]*"|\S+/g) || [];

  if (!terms || terms.length === 0) {
    return '';
  }

  const lastTerm = terms[terms.length - 1];

  if (!lastTerm.toLowerCase().startsWith('pub:"')) {
    return '';
  }

  const match = lastTerm.match(/pub:"([^"]*)"?$/i);

  if (!match) {
    return '';
  }

  const keyword = match[1];
  const start = query.length - lastTerm.length + 'pub:"'.length - 1;
  const end = lastTerm.endsWith('"') ? query.length - 1 : query.length;

  const isWithin = cursorPosition >= start && cursorPosition <= end;

  return isWithin ? keyword : '';
};

describe('Journal search space handling', () => {
  test('extracts search term with spaces from incomplete journal query', () => {
    const query = 'pub:"astrophysical jou';
    const cursorPosition = query.length;

    const result = getJournalSearchTerm(query, cursorPosition);
    expect(result).toBe('astrophysical jou');
  });

  test('extracts search term from complete journal query', () => {
    const query = 'pub:"astrophysical journal"';
    const cursorPosition = query.length - 1; // Inside the quotes

    const result = getJournalSearchTerm(query, cursorPosition);
    expect(result).toBe('astrophysical journal');
  });

  test('extracts search term when cursor is within quoted journal name', () => {
    const query = 'author:"smith" pub:"journal of space research"';
    const cursorPosition = 30; // Inside the journal name

    const result = getJournalSearchTerm(query, cursorPosition);
    expect(result).toBe('journal of space research');
  });

  test('does not extract when cursor is outside journal quotes', () => {
    const query = 'author:"smith" pub:"journal"';
    const cursorPosition = 10; // In the author field

    const result = getJournalSearchTerm(query, cursorPosition);
    expect(result).toBe('');
  });

  test('handles mixed UAT and journal queries', () => {
    const query = 'author:"smith" uat:"galaxies" pub:"astro';
    const cursorPosition = query.length;

    const result = getJournalSearchTerm(query, cursorPosition);
    expect(result).toBe('astro');
  });

  test('handles empty journal search term', () => {
    const query = 'pub:"';
    const cursorPosition = query.length;

    const result = getJournalSearchTerm(query, cursorPosition);
    expect(result).toBe('');
  });

  test('handles journal search with only spaces', () => {
    const query = 'pub:"   ';
    const cursorPosition = query.length;

    const result = getJournalSearchTerm(query, cursorPosition);
    expect(result).toBe('   ');
  });
});
