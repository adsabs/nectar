import { describe, expect, test } from 'vitest';
import { journalsKeys } from '@/api/journals/journals';
import { IJournalSearchParams } from '@/api/journals/types';

describe('Journal API Keys', () => {
  test('searchOptions key includes fieldType for proper caching', () => {
    const params1: IJournalSearchParams = { term: 'astro', fieldType: 'pub' };
    const params2: IJournalSearchParams = { term: 'astro', fieldType: 'bibstem' };
    const params3: IJournalSearchParams = { term: 'astro' }; // no fieldType

    const key1 = journalsKeys.searchOptions(params1);
    const key2 = journalsKeys.searchOptions(params2);
    const key3 = journalsKeys.searchOptions(params3);

    // Keys should be different when fieldType differs
    expect(key1).not.toEqual(key2);
    expect(key1).not.toEqual(key3);
    expect(key2).not.toEqual(key3);

    // Keys should be arrays with correct structure
    expect(key1).toEqual(['journals/search-options', params1]);
    expect(key2).toEqual(['journals/search-options', params2]);
    expect(key3).toEqual(['journals/search-options', params3]);
  });

  test('searchOptions key differentiates between terms', () => {
    const params1: IJournalSearchParams = { term: 'astro', fieldType: 'pub' };
    const params2: IJournalSearchParams = { term: 'physics', fieldType: 'pub' };

    const key1 = journalsKeys.searchOptions(params1);
    const key2 = journalsKeys.searchOptions(params2);

    expect(key1).not.toEqual(key2);
  });

  test('searchOptions key is identical for same parameters', () => {
    const params1: IJournalSearchParams = { term: 'astro', fieldType: 'bibstem' };
    const params2: IJournalSearchParams = { term: 'astro', fieldType: 'bibstem' };

    const key1 = journalsKeys.searchOptions(params1);
    const key2 = journalsKeys.searchOptions(params2);

    expect(key1).toEqual(key2);
  });

  test('searchOptions key handles undefined fieldType consistently', () => {
    const params1: IJournalSearchParams = { term: 'astro' };
    const params2: IJournalSearchParams = { term: 'astro', fieldType: undefined };

    const key1 = journalsKeys.searchOptions(params1);
    const key2 = journalsKeys.searchOptions(params2);

    expect(key1).toEqual(key2);
  });

  test('other journal keys maintain their structure', () => {
    const journalKey = journalsKeys.journal({ term: 'test' });
    const summaryKey = journalsKeys.summary({ bibstem: 'ApJ' });
    const issnKey = journalsKeys.issn({ issn: '1234-5678' });
    const searchTermKey = journalsKeys.searchTerm('test');

    expect(journalKey).toEqual(['journals/journal', { term: 'test' }]);
    expect(summaryKey).toEqual(['journals/summary', { bibstem: 'ApJ' }]);
    expect(issnKey).toEqual(['journals/issn', { issn: '1234-5678' }]);
    expect(searchTermKey).toEqual(['journals/search-term', 'test']);
  });
});
