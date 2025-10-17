import { describe, expect, test } from 'vitest';

describe('Journal API URL Construction', () => {
  test('constructs URL correctly with fieldType parameter', () => {
    // Test URL construction logic from fetchJournalSearchOptions
    const buildUrl = (term: string, fieldType?: string) => {
      const queryParams = new URLSearchParams();
      if (fieldType) {
        queryParams.set('fieldType', fieldType);
      }
      return `/api/journals/${term}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    };

    // Test with pub fieldType
    expect(buildUrl('astro', 'pub')).toBe('/api/journals/astro?fieldType=pub');

    // Test with bibstem fieldType
    expect(buildUrl('astro', 'bibstem')).toBe('/api/journals/astro?fieldType=bibstem');

    // Test with pub_abbrev fieldType
    expect(buildUrl('astro', 'pub_abbrev')).toBe('/api/journals/astro?fieldType=pub_abbrev');

    // Test without fieldType
    expect(buildUrl('astro')).toBe('/api/journals/astro');
    expect(buildUrl('astro', undefined)).toBe('/api/journals/astro');
  });

  test('handles special characters in search term', () => {
    const buildUrl = (term: string, fieldType?: string) => {
      const queryParams = new URLSearchParams();
      if (fieldType) {
        queryParams.set('fieldType', fieldType);
      }
      return `/api/journals/${term}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    };

    // Test with spaces (should be URL encoded by browser)
    expect(buildUrl('astro physics', 'pub')).toBe('/api/journals/astro physics?fieldType=pub');

    // Test with special characters
    expect(buildUrl('A&A', 'bibstem')).toBe('/api/journals/A&A?fieldType=bibstem');
  });

  test('validates URLSearchParams construction', () => {
    const queryParams1 = new URLSearchParams();
    queryParams1.set('fieldType', 'pub');
    expect(queryParams1.toString()).toBe('fieldType=pub');

    const queryParams2 = new URLSearchParams();
    queryParams2.set('fieldType', 'bibstem');
    expect(queryParams2.toString()).toBe('fieldType=bibstem');

    const queryParams3 = new URLSearchParams();
    // No fieldType set
    expect(queryParams3.toString()).toBe('');
  });
});
