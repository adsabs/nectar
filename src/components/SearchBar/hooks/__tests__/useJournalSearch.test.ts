import { describe, expect, test } from 'vitest';
import { getJournalSearchTerm, getJournalFieldType } from '@/components/SearchBar/hooks/useJournalSearch';

describe('Journal Search Term Extraction', () => {
  test('extracts term from complete pub: query', () => {
    const result = getJournalSearchTerm('author:"Smith" pub:"astrophys"', 28);
    expect(result).toBe('astrophys');
  });

  test('extracts term from incomplete pub: query with spaces', () => {
    const query = 'author:"Smith" pub:"astrophysical jou';
    const result = getJournalSearchTerm(query, query.length);
    expect(result).toBe('astrophysical jou');
  });

  test('returns empty string when cursor is not in pub: field', () => {
    const result = getJournalSearchTerm('author:"Smith" pub:"test"', 10);
    expect(result).toBe('');
  });

  test('returns empty string for non-pub queries', () => {
    const result = getJournalSearchTerm('author:"Smith" title:"test"', 20);
    expect(result).toBe('');
  });

  test('handles bare pub: query', () => {
    const result = getJournalSearchTerm('pub:"journal"', 12);
    expect(result).toBe('journal');
  });

  test('handles empty pub: query', () => {
    const result = getJournalSearchTerm('pub:""', 5);
    expect(result).toBe('');
  });

  test('handles cursor at beginning of pub: field', () => {
    const result = getJournalSearchTerm('pub:"test"', 5);
    expect(result).toBe('test');
  });

  test('handles cursor at end of complete pub: field', () => {
    // Position 10 is after the closing quote in 'pub:"test"' (length 10)
    const result = getJournalSearchTerm('pub:"test"', 10);
    expect(result).toBe('');
  });

  test('extracts from incomplete quoted term with multiple words', () => {
    const query = 'pub:"astrophysical journal supplement';
    const result = getJournalSearchTerm(query, query.length);
    expect(result).toBe('astrophysical journal supplement');
  });

  test('handles mixed case pub field', () => {
    const result = getJournalSearchTerm('PUB:"test"', 9);
    expect(result).toBe('test');
  });

  test('handles pub: query in middle of search with cursor elsewhere', () => {
    const result = getJournalSearchTerm('pub:"ApJ" author:"Smith"', 20);
    expect(result).toBe('');
  });

  test('handles multiple pub: fields, extracts from last one', () => {
    const result = getJournalSearchTerm('pub:"first" pub:"second"', 22);
    expect(result).toBe('second');
  });

  test('extracts term from bibstem: query', () => {
    const result = getJournalSearchTerm('author:"Smith" bibstem:"ApJ"', 27);
    expect(result).toBe('ApJ');
  });

  test('extracts term from incomplete bibstem: query', () => {
    const query = 'bibstem:"Ap';
    const result = getJournalSearchTerm(query, query.length);
    expect(result).toBe('Ap');
  });

  test('extracts term from pub_abbrev: query', () => {
    const result = getJournalSearchTerm('pub_abbrev:"ApJ"', 15);
    expect(result).toBe('ApJ');
  });

  test('extracts term from incomplete pub_abbrev: query', () => {
    const query = 'pub_abbrev:"Astro';
    const result = getJournalSearchTerm(query, query.length);
    expect(result).toBe('Astro');
  });

  test('handles mixed field types', () => {
    const result = getJournalSearchTerm('pub:"journal" bibstem:"ApJ"', 26);
    expect(result).toBe('ApJ');
  });

  test('getJournalFieldType detects bibstem field correctly', () => {
    const result = getJournalFieldType('bibstem:"ApJ"', 10);
    expect(result).toBe('bibstem');
  });

  test('getJournalFieldType detects pub field correctly', () => {
    const result = getJournalFieldType('pub:"astro"', 8);
    expect(result).toBe('pub');
  });

  test('getJournalFieldType detects pub_abbrev field correctly', () => {
    const result = getJournalFieldType('pub_abbrev:"ApJ"', 12);
    expect(result).toBe('pub_abbrev');
  });

  test('getJournalFieldType returns null when cursor is outside field', () => {
    const result = getJournalFieldType('pub:"astro" author:"Smith"', 20);
    expect(result).toBe(null);
  });

  test('getJournalFieldType returns null for non-journal fields', () => {
    const result = getJournalFieldType('author:"Smith" title:"test"', 15);
    expect(result).toBe(null);
  });

  test('getJournalFieldType handles incomplete fields', () => {
    const result = getJournalFieldType('bibstem:"', 9);
    expect(result).toBe('bibstem');
  });

  test('getJournalFieldType handles cursor at field boundary', () => {
    // Cursor right after the opening quote
    const result = getJournalFieldType('pub:"test"', 5);
    expect(result).toBe('pub');
  });

  test('getJournalFieldType handles cursor at closing quote', () => {
    // Cursor at the closing quote position
    const result = getJournalFieldType('pub:"test"', 9);
    expect(result).toBe('pub');
  });

  test('getJournalFieldType handles cursor after closing quote', () => {
    // Cursor after the closing quote
    const result = getJournalFieldType('pub:"test"', 10);
    expect(result).toBe(null);
  });

  test('getJournalFieldType is case insensitive', () => {
    const result = getJournalFieldType('PUB:"test"', 7);
    expect(result).toBe('pub');
  });

  test('getJournalFieldType handles mixed case field names', () => {
    const result = getJournalFieldType('BIBSTEM:"test"', 10);
    expect(result).toBe('bibstem');
  });

  test('getJournalSearchTerm handles unicode characters', () => {
    const result = getJournalSearchTerm('pub:"Astrofísica"', 15);
    expect(result).toBe('Astrofísica');
  });

  test('getJournalSearchTerm handles special characters', () => {
    const result = getJournalSearchTerm('pub:"A&A Supplement"', 18);
    expect(result).toBe('A&A Supplement');
  });

  test('getJournalFieldType prioritizes last matching field', () => {
    const result = getJournalFieldType('pub:"first" bibstem:"second"', 26);
    expect(result).toBe('bibstem');
  });
});
