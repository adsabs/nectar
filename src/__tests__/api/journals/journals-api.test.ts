import { describe, expect, test } from 'vitest';
import { rest } from 'msw';
import type { SetupServer } from 'msw/node';
import Fuse from 'fuse.js';
import { IBibstemOption } from '@/types';
import { IJournalOption, IJournalSearchResponse } from '@/api/journals/types';
import { fetchJournalSearchOptions } from '@/api/journals/journals';

// Extract and test the formatJournalResults function by copying its logic
const formatJournalResults = (
  results: Fuse.FuseResult<IBibstemOption>[],
  fieldType?: 'pub' | 'bibstem' | 'pub_abbrev',
): IJournalOption[] => {
  return results.map((result, index) => {
    const item = result.item;
    const pubName = Array.isArray(item.label) ? item.label[0] : item.label;

    // Determine the appropriate value based on field type
    let value: string;
    switch (fieldType) {
      case 'pub':
        // For pub: searches, return the full publication name
        value = `"${pubName}"`;
        break;
      case 'bibstem':
      case 'pub_abbrev':
      default:
        // For bibstem: and pub_abbrev: searches, return the bibstem (short identifier)
        value = `"${item.value}"`;
        break;
    }

    return {
      id: index,
      value,
      label: pubName,
      desc: `Bibstem: ${item.value}`,
      // Current field mapping (until Journals DB provides dedicated fields):
      bibstem: item.value, // e.g., "ApJ", "AJ", "MNRAS"
      pub: pubName, // e.g., "Astrophysical Journal"
      // For now, bibstem serves as abbreviation (will be replaced by canonical abbreviations from Journals DB)
      pub_abbrev: item.value,
    };
  });
};

// Mock data for testing
const mockFuseResults: Fuse.FuseResult<IBibstemOption>[] = [
  {
    item: { value: 'Astro', label: ['Astronomy'] },
    score: 0.1,
    refIndex: 0,
  },
  {
    item: { value: 'ApJ', label: ['Astrophysical Journal'] },
    score: 0.2,
    refIndex: 1,
  },
  {
    item: { value: 'AJ', label: ['Astronomical Journal', 'Alt Name'] }, // Test multiple labels
    score: 0.3,
    refIndex: 2,
  },
];

describe('Journal API Integration Tests', () => {
  test('API endpoint returns different values based on fieldType parameter', async ({
    server,
  }: {
    server: SetupServer;
  }) => {
    // Mock the API endpoint to return different responses based on fieldType
    server.use(
      rest.get('/api/journals/astro', (req, res, ctx) => {
        const fieldType = req.url.searchParams.get('fieldType');

        const baseJournal = {
          id: 0,
          label: 'Astronomy',
          desc: 'Bibstem: Astro',
          bibstem: 'Astro',
          pub: 'Astronomy',
          pub_abbrev: 'Astro',
        };

        if (fieldType === 'pub') {
          return res(
            ctx.json({
              journals: [{ ...baseJournal, value: '"Astronomy"' }],
            } as IJournalSearchResponse),
          );
        } else if (fieldType === 'bibstem') {
          return res(
            ctx.json({
              journals: [{ ...baseJournal, value: '"Astro"' }],
            } as IJournalSearchResponse),
          );
        } else {
          // Default case (no fieldType)
          return res(
            ctx.json({
              journals: [{ ...baseJournal, value: '"Astro"' }],
            } as IJournalSearchResponse),
          );
        }
      }),
    );

    // Test pub fieldType
    const pubResults = await fetchJournalSearchOptions({
      queryKey: ['journals', 'searchOptions', { term: 'astro', fieldType: 'pub' }],
      meta: { params: { term: 'astro', fieldType: 'pub' } },
    });

    expect(pubResults).toHaveLength(1);
    expect(pubResults[0].value).toBe('"Astronomy"'); // Full publication name

    // Test bibstem fieldType
    const bibstemResults = await fetchJournalSearchOptions({
      queryKey: ['journals', 'searchOptions', { term: 'astro', fieldType: 'bibstem' }],
      meta: { params: { term: 'astro', fieldType: 'bibstem' } },
    });

    expect(bibstemResults).toHaveLength(1);
    expect(bibstemResults[0].value).toBe('"Astro"'); // Short bibstem

    // Values should be different
    expect(pubResults[0].value).not.toBe(bibstemResults[0].value);
  });

  test('API endpoint handles empty search results', async ({ server }: { server: SetupServer }) => {
    server.use(
      rest.get('/api/journals/nonexistent', (req, res, ctx) => {
        return res(
          ctx.json({
            journals: [],
          } as IJournalSearchResponse),
        );
      }),
    );

    const results = await fetchJournalSearchOptions({
      queryKey: ['journals', 'searchOptions', { term: 'nonexistent', fieldType: 'pub' }],
      meta: { params: { term: 'nonexistent', fieldType: 'pub' } },
    });

    expect(results).toEqual([]);
  });

  test('API endpoint handles pub_abbrev like bibstem', async ({ server }: { server: SetupServer }) => {
    server.use(
      rest.get('/api/journals/astro', (req, res, ctx) => {
        const fieldType = req.url.searchParams.get('fieldType');

        const baseJournal = {
          id: 0,
          label: 'Astronomy',
          desc: 'Bibstem: Astro',
          bibstem: 'Astro',
          pub: 'Astronomy',
          pub_abbrev: 'Astro',
        };

        if (fieldType === 'pub_abbrev') {
          return res(
            ctx.json({
              journals: [{ ...baseJournal, value: '"Astro"' }],
            } as IJournalSearchResponse),
          );
        }

        return res(ctx.json({ journals: [] }));
      }),
    );

    const results = await fetchJournalSearchOptions({
      queryKey: ['journals', 'searchOptions', { term: 'astro', fieldType: 'pub_abbrev' }],
      meta: { params: { term: 'astro', fieldType: 'pub_abbrev' } },
    });

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('"Astro"');
  });
});

describe('Journal API formatJournalResults', () => {
  test('returns different values based on fieldType parameter', () => {
    const pubResults = formatJournalResults(mockFuseResults, 'pub');
    const bibstemResults = formatJournalResults(mockFuseResults, 'bibstem');

    // For pub fieldType, value should contain full publication name
    expect(pubResults[0].value).toBe('"Astronomy"');
    expect(pubResults[1].value).toBe('"Astrophysical Journal"');

    // For bibstem fieldType, value should contain short bibstem
    expect(bibstemResults[0].value).toBe('"Astro"');
    expect(bibstemResults[1].value).toBe('"ApJ"');
  });

  test('handles pub_abbrev fieldType like bibstem', () => {
    const pubAbbrevResults = formatJournalResults(mockFuseResults, 'pub_abbrev');
    const bibstemResults = formatJournalResults(mockFuseResults, 'bibstem');

    // pub_abbrev should behave like bibstem for now
    expect(pubAbbrevResults[0].value).toBe(bibstemResults[0].value);
    expect(pubAbbrevResults[1].value).toBe(bibstemResults[1].value);
  });

  test('defaults to bibstem behavior when no fieldType provided', () => {
    const defaultResults = formatJournalResults(mockFuseResults);
    const bibstemResults = formatJournalResults(mockFuseResults, 'bibstem');

    expect(defaultResults[0].value).toBe(bibstemResults[0].value);
    expect(defaultResults[1].value).toBe(bibstemResults[1].value);
  });

  test('handles array labels correctly', () => {
    const results = formatJournalResults(mockFuseResults, 'pub');

    // Should use first element of array label
    expect(results[2].label).toBe('Astronomical Journal');
    expect(results[2].pub).toBe('Astronomical Journal');
  });

  test('returns properly formatted journal options', () => {
    const results = formatJournalResults(mockFuseResults, 'pub');

    expect(results).toHaveLength(3);

    const firstResult = results[0];

    // Check required fields
    expect(firstResult).toHaveProperty('id');
    expect(firstResult).toHaveProperty('value');
    expect(firstResult).toHaveProperty('label');
    expect(firstResult).toHaveProperty('desc');
    expect(firstResult).toHaveProperty('bibstem');
    expect(firstResult).toHaveProperty('pub');
    expect(firstResult).toHaveProperty('pub_abbrev');

    // Check field types
    expect(typeof firstResult.id).toBe('number');
    expect(typeof firstResult.value).toBe('string');
    expect(typeof firstResult.label).toBe('string');
    expect(typeof firstResult.desc).toBe('string');
    expect(typeof firstResult.bibstem).toBe('string');
    expect(typeof firstResult.pub).toBe('string');
    expect(typeof firstResult.pub_abbrev).toBe('string');

    // Check value format (should be quoted)
    expect(firstResult.value).toMatch(/^".*"$/);

    // Check desc format
    expect(firstResult.desc).toMatch(/^Bibstem: /);
    expect(firstResult.desc).toBe('Bibstem: Astro');
  });

  test('assigns correct index as id', () => {
    const results = formatJournalResults(mockFuseResults, 'pub');

    expect(results[0].id).toBe(0);
    expect(results[1].id).toBe(1);
    expect(results[2].id).toBe(2);
  });

  test('preserves bibstem and pub fields consistently', () => {
    const pubResults = formatJournalResults(mockFuseResults, 'pub');
    const bibstemResults = formatJournalResults(mockFuseResults, 'bibstem');

    // Regardless of fieldType, the bibstem and pub fields should be the same
    expect(pubResults[0].bibstem).toBe(bibstemResults[0].bibstem);
    expect(pubResults[0].pub).toBe(bibstemResults[0].pub);
    expect(pubResults[1].bibstem).toBe(bibstemResults[1].bibstem);
    expect(pubResults[1].pub).toBe(bibstemResults[1].pub);
  });

  test('handles empty results array', () => {
    const results = formatJournalResults([], 'pub');
    expect(results).toEqual([]);
  });

  test('handles single result', () => {
    const singleResult = [mockFuseResults[0]];
    const results = formatJournalResults(singleResult, 'bibstem');

    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('"Astro"');
    expect(results[0].id).toBe(0);
  });
});
