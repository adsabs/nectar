import { describe, expect, it, vi, beforeEach } from 'vitest';
import { authorsTransform } from '../authors';
import type { IDocsEntity } from '@/api/search/types';

// Mock config for deterministic ORCID base
vi.mock('@/config', () => ({
  EXTERNAL_URLS: { ORCID: 'https://orcid.org' },
}));

describe('authorsTransform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps authors to Person and attaches valid ORCIDs', () => {
    const doc: Partial<IDocsEntity> = {
      author: ['Jane Doe', 'John Smith', 'Sam Lee'],
      orcid_user: [
        '0000-0002-1825-0097', // valid
        '-', // sentinel ignored
        '0000-0003-1234-567x', // lower x normalized to X
      ],
    };

    const people = authorsTransform(doc);
    expect(people).toEqual([
      {
        '@type': 'Person',
        name: 'Jane Doe',
        sameAs: ['https://orcid.org/0000-0002-1825-0097'],
        identifier: {
          '@type': 'PropertyValue',
          propertyID: 'ORCID',
          value: '0000-0002-1825-0097',
        },
      },
      { '@type': 'Person', name: 'John Smith' },
      {
        '@type': 'Person',
        name: 'Sam Lee',
        sameAs: ['https://orcid.org/0000-0003-1234-567X'],
        identifier: {
          '@type': 'PropertyValue',
          propertyID: 'ORCID',
          value: '0000-0003-1234-567X',
        },
      },
    ]);
  });

  it('is resilient when orcid_user is missing or shorter than author list', () => {
    const doc: Partial<IDocsEntity> = {
      author: ['A', 'B', 'C'],
      // no orcid_user
    };
    expect(authorsTransform(doc)).toEqual([
      { '@type': 'Person', name: 'A' },
      { '@type': 'Person', name: 'B' },
      { '@type': 'Person', name: 'C' },
    ]);
  });

  it('ignores empty, whitespace, and invalid ORCID values', () => {
    const doc: Partial<IDocsEntity> = {
      author: ['A1', 'A2', 'A3', 'A4'],
      orcid_user: [' ', '', 'not-an-orcid', '-'],
    };
    expect(authorsTransform(doc)).toEqual([
      { '@type': 'Person', name: 'A1' },
      { '@type': 'Person', name: 'A2' },
      { '@type': 'Person', name: 'A3' },
      { '@type': 'Person', name: 'A4' },
    ]);
  });

  it('does not throw if inputs are not arrays (coerces to arrays)', () => {
    const doc = {
      author: 'Single Author',
      orcid_user: '0000-0002-1825-0097',
    } as unknown as Partial<IDocsEntity>;
    const people = authorsTransform(doc);
    expect(people).toEqual([
      {
        '@type': 'Person',
        name: 'Single Author',
        sameAs: ['https://orcid.org/0000-0002-1825-0097'],
        identifier: {
          '@type': 'PropertyValue',
          propertyID: 'ORCID',
          value: '0000-0002-1825-0097',
        },
      },
    ]);
  });

  it('handles non-string author entries without throwing', () => {
    const doc = {
      author: [' A ', 42, null, undefined],
      orcid_user: [],
    } as unknown as Partial<IDocsEntity>;
    const people = authorsTransform(doc);
    expect(people).toEqual([
      { '@type': 'Person', name: 'A' },
      { '@type': 'Person', name: '42' },
      { '@type': 'Person', name: '' },
      { '@type': 'Person', name: '' },
    ]);
  });
});
