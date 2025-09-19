import { describe, expect, it } from 'vitest';
import { collectIdentifiersFromArray } from '../identifiers';

describe('collectIdentifiersFromArray', () => {
  it('parses common IDs from identifier[] only', () => {
    const { identifiers, sameAs } = collectIdentifiersFromArray({
      identifier: [
        'arXiv:2503.12263',
        '10.48550/arXiv.2503.12263',
        'PMID: 12345',
        'PMCID: PMC999999',
        'hdl:1234/abc',
        'hal-0123456',
        'W123',
        'Q456',
        'S2PaperId:abcdef',
        '2025arXiv250312263A', // ADS bibcode
      ],
    });

    const set = new Set(identifiers.map((p) => `${p.propertyID}:${p.value}`));
    expect(set.has('arXiv:2503.12263')).toBe(true);
    expect(set.has('DOI:10.48550/arXiv.2503.12263')).toBe(true);
    expect(set.has('PMID:12345')).toBe(true);
    expect(set.has('PMCID:PMC999999')).toBe(true);
    expect(set.has('Handle:1234/abc')).toBe(true);
    expect(set.has('HAL:0123456')).toBe(true);
    expect(set.has('OpenAlex:W123')).toBe(true);
    expect(set.has('Wikidata:Q456')).toBe(true);
    expect(set.has('S2PaperId:abcdef')).toBe(true);
    expect(set.has('ADS Bibcode:2025arXiv250312263A')).toBe(true);

    expect(sameAs).toContain('https://arxiv.org/abs/2503.12263');
    expect(sameAs).toContain('https://doi.org/10.48550/arXiv.2503.12263');
    expect(sameAs).toContain('https://ui.adsabs.harvard.edu/abs/2025arXiv250312263A/abstract');
    expect(sameAs).toContain('https://hdl.handle.net/1234/abc');
    expect(sameAs).toContain('https://hal.science/0123456');
    expect(sameAs).toContain('https://openalex.org/W123');
    expect(sameAs).toContain('https://www.wikidata.org/wiki/Q456');
    expect(sameAs).toContain('https://www.semanticscholar.org/paper/abcdef');
  });

  it('ignores junk without throwing', () => {
    const { identifiers, sameAs } = collectIdentifiersFromArray({
      identifier: ['', '  ', 'not-an-id', 0 as unknown as string],
    });
    expect(Array.isArray(identifiers)).toBe(true);
    expect(Array.isArray(sameAs)).toBe(true);
  });

  it('dedupes duplicate identifiers and trims spaces/tags', () => {
    const { identifiers, sameAs } = collectIdentifiersFromArray({
      identifier: [
        'arXiv:2503.12263',
        ' arXiv:2503.12263 ', // duplicate with spaces
        'PMID: 12345',
        'PMID:12345', // duplicate different spacing
        'hdl:1234/abc',
        '1234/abc', // matches hdlMaybe and normalizes to same Handle value
      ],
    });

    const set = new Set(identifiers.map((p) => `${p.propertyID}:${p.value}`));
    expect(set.size).toBe(3);
    expect(set.has('arXiv:2503.12263')).toBe(true);
    expect(set.has('PMID:12345')).toBe(true);
    expect(set.has('Handle:1234/abc')).toBe(true);

    // sameAs also deduped
    const sa = new Set(sameAs);
    expect(sa.has('https://arxiv.org/abs/2503.12263')).toBe(true);
    expect(sa.has('https://pubmed.ncbi.nlm.nih.gov/12345/')).toBe(true);
    expect(sa.has('https://hdl.handle.net/1234/abc')).toBe(true);
    expect(sa.size).toBe(3);
  });
});
