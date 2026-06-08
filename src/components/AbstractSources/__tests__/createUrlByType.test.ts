import { describe, expect, test } from 'vitest';
import { createUrlByType } from '@/components/AbstractSources/linkGenerator';

describe('createUrlByType', () => {
  test('encodes # in a DOI identifier', () => {
    const url = createUrlByType(
      '1999AN....320..163M',
      'doi',
      '10.1002/1521-3994(199908)320:4/5<163::AID-ASNA163>3.0.CO;2-#',
    );
    expect(url).not.toContain('#');
    expect(url).toContain('%23');
  });

  test('encodes < and > in a DOI identifier', () => {
    const url = createUrlByType('test', 'doi', '10.1000/foo<bar>');
    expect(url).toContain('%3C');
    expect(url).toContain('%3E');
    expect(url).not.toContain('<');
    expect(url).not.toContain('>');
  });

  test('preserves / in DOI identifiers', () => {
    const url = createUrlByType('test', 'doi', '10.48550/arXiv.2507.19320');
    expect(url).toContain('10.48550/arXiv.2507.19320');
  });

  test('fully encodes / in non-DOI identifiers (e.g. legacy arXiv ids)', () => {
    const url = createUrlByType('test', 'arxiv', 'hep-th/9901001');
    expect(url).toContain('arxiv:hep-th%2F9901001');
    expect(url).not.toContain('arxiv:hep-th/9901001');
  });

  test('encodes the bibcode for consistency with the gateway url', () => {
    const url = createUrlByType('2020A&A...1..1X', 'doi', '10.1000/x');
    expect(url).toContain('2020A%26A...1..1X');
    expect(url).not.toContain('2020A&A');
  });

  test('returns empty string for non-string arguments', () => {
    expect(createUrlByType(null as unknown as string, 'doi', '10.1000/x')).toBe('');
    expect(createUrlByType('bib', null as unknown as string, '10.1000/x')).toBe('');
    expect(createUrlByType('bib', 'doi', null as unknown as string)).toBe('');
  });
});
