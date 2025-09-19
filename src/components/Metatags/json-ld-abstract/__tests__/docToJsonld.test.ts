import { beforeEach, describe, expect, it, vi } from 'vitest';
// --- Import after mocks so they take effect ---
import { docToJsonld } from '../docToJsonld';
import { IDocsEntity } from '@/api/search/types';

const SCIX_CANONICAL_BASE_URL = 'https://scixplorer.org' as const;

// --- Mocks ---
// We control the output of the identifier collector so tests are stable
// Accept an argument to satisfy the mocked signature used below
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockCollect = vi.fn((...args) => ({
  identifiers: [
    { '@type': 'PropertyValue', propertyID: 'ADS Bibcode', value: '2025arXiv250312263A' },
    { '@type': 'PropertyValue', propertyID: 'DOI', value: '10.48550/arXiv.2503.12263' },
    { '@type': 'PropertyValue', propertyID: 'arXiv', value: '2503.12263' },
  ],
  sameAs: [
    'https://ui.adsabs.harvard.edu/abs/2025arXiv250312263A/abstract',
    'https://doi.org/10.48550/arXiv.2503.12263',
    'https://arxiv.org/abs/2503.12263',
  ],
}));

vi.mock('../identifiers', () => ({
  collectIdentifiersFromArray: (...args: unknown[]) => mockCollect(...args),
}));

describe('docToJsonld', () => {
  beforeEach(() => {
    mockCollect.mockClear();
  });

  it('builds a ScholarlyArticle JSON-LD with canonical SciXplorer URL/ID and mapped fields', () => {
    const doc: Partial<IDocsEntity> = {
      bibcode: '2025arXiv250312263A',
      title: ['The Science of the Einstein Telescope'],
      abstract: 'Einstein Telescope (ET) is the European project...',
      pubdate: '2025-03-00',
      keyword: ['General Relativity and Quantum Cosmology', 'Nuclear Theory'],
      uat: ['general relativity', 'gravitational waves'],
      uat_id: [641, 678],
      identifier: ['arXiv:2503.12263', '10.48550/arXiv.2503.12263', '2025arXiv250312263A'],
    };

    const jsonld = docToJsonld(doc, SCIX_CANONICAL_BASE_URL);

    // Top-level type + canonical IDs
    expect(jsonld['@context']).toBe('https://schema.org');
    expect(jsonld['@type']).toBe('ScholarlyArticle');
    expect(jsonld['@id']).toBe('https://scixplorer.org/abs/2025arXiv250312263A/abstract');
    expect(jsonld.url).toBe('https://scixplorer.org/abs/2025arXiv250312263A/abstract');

    // Basic fields
    expect(jsonld.name).toBe('The Science of the Einstein Telescope');
    expect(jsonld.headline).toBe('The Science of the Einstein Telescope');
    expect(jsonld.abstract).toMatch(/^Einstein Telescope/);
    expect(jsonld.inLanguage).toBe('en');
    expect(jsonld.isAccessibleForFree).toBe(true);
    expect(jsonld.datePublished).toBe('2025-03-00'); // NOTE: current code passes through

    // Identifiers & sameAs come from the helper (mocked)
    console.log(mockCollect.mock.calls);
    expect(mockCollect).toHaveBeenCalledWith({ identifier: doc.identifier });
    expect(jsonld.identifier).toEqual([
      { '@type': 'PropertyValue', propertyID: 'ADS Bibcode', value: '2025arXiv250312263A' },
      { '@type': 'PropertyValue', propertyID: 'DOI', value: '10.48550/arXiv.2503.12263' },
      { '@type': 'PropertyValue', propertyID: 'arXiv', value: '2503.12263' },
    ]);
    expect(jsonld.sameAs).toEqual([
      'https://ui.adsabs.harvard.edu/abs/2025arXiv250312263A/abstract',
      'https://doi.org/10.48550/arXiv.2503.12263',
      'https://arxiv.org/abs/2503.12263',
    ]);

    // Keywords: merged ADS keywords + UAT text (no dedupe by design)
    expect(jsonld.keywords).toEqual([
      'General Relativity and Quantum Cosmology',
      'Nuclear Theory',
      'general relativity',
      'gravitational waves',
    ]);

    // about[] built from UAT + UAT IDs
    expect(jsonld.about).toEqual([
      {
        '@type': 'Thing',
        name: 'general relativity',
        identifier: 'http://astrothesaurus.org/uat/641',
      },
      {
        '@type': 'Thing',
        name: 'gravitational waves',
        identifier: 'http://astrothesaurus.org/uat/678',
      },
    ]);
  });

  it('URL-encodes the bibcode in @id and url', () => {
    // Simulate an unusual bibcode that needs encoding to ensure code path is correct
    const doc: Partial<IDocsEntity> = {
      bibcode: '2025arXiv2503/12263A', // slash will be encoded
      title: ['X'],
      abstract: '',
      pubdate: '',
      keyword: [],
      uat: [],
      uat_id: [],
      identifier: [],
    };

    const jsonld = docToJsonld(doc, SCIX_CANONICAL_BASE_URL);
    expect(jsonld['@id']).toBe('https://scixplorer.org/abs/2025arXiv2503%2F12263A/abstract');
    expect(jsonld.url).toBe('https://scixplorer.org/abs/2025arXiv2503%2F12263A/abstract');
  });

  it('strips HTML tags from abstract for JSON-LD', () => {
    const doc: Partial<IDocsEntity> = {
      bibcode: '2025arXiv250312263A',
      title: ['X'],
      abstract: '<p>Einstein <i>Telescope</i> is the <a href="#">European</a> project...</p>',
      pubdate: '',
      keyword: [],
      uat: [],
      uat_id: [],
      identifier: [],
    };

    const jsonld = docToJsonld(doc, SCIX_CANONICAL_BASE_URL);
    expect(jsonld.abstract).toBe('Einstein Telescope is the European project...');
  });

  it('strips HTML tags from title for JSON-LD', () => {
    const doc: Partial<IDocsEntity> = {
      bibcode: '2025arXiv250312263A',
      title: ['<b>The</b> <i>Science</i> of <span>ET</span>'],
      abstract: 'x',
      pubdate: '',
      keyword: [],
      uat: [],
      uat_id: [],
      identifier: [],
    };

    const jsonld = docToJsonld(doc, SCIX_CANONICAL_BASE_URL);
    expect(jsonld.name).toBe('The Science of ET');
    expect(jsonld.headline).toBe('The Science of ET');
  });
});
