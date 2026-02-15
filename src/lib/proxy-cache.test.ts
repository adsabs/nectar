import { describe, expect, it } from 'vitest';

import { buildCacheKey, flattenParams, isAllowedPath } from './proxy-cache';

describe('buildCacheKey', () => {
  it('builds key with sorted params', () => {
    const key = buildCacheKey('GET', '/search/query', {
      q: 'black holes',
      fl: 'title',
      rows: '10',
    });

    expect(key).toBe('scix:cache:GET:/search/query?fl=title&q=black%20holes&rows=10');
  });

  it('sorts params deterministically regardless of input order', () => {
    const params = { z: 'last', a: 'first', m: 'mid' };
    const key = buildCacheKey('POST', '/resolver', params);
    expect(key).toBe('scix:cache:POST:/resolver?a=first&m=mid&z=last');
  });

  it('omits query string when params are empty', () => {
    const key = buildCacheKey('GET', '/search/query', {});
    expect(key).toBe('scix:cache:GET:/search/query');
  });

  it('handles special characters deterministically', () => {
    const key = buildCacheKey('PATCH', '/resolver/2024ApJ...123A', {
      'weird key': 'value/value',
      'another key': 'emoji 😀',
    });

    expect(key).toBe(
      'scix:cache:PATCH:/resolver/2024ApJ...123A?another%20key=emoji%20%F0%9F%98%80&weird%20key=value%2Fvalue',
    );
  });
});

describe('flattenParams', () => {
  it('joins arrays into comma-separated strings', () => {
    const result = flattenParams({ fl: ['bibcode', 'title', 'author'], q: 'black holes' });
    expect(result).toEqual({ fl: 'bibcode,title,author', q: 'black holes' });
  });

  it('passes scalar strings through unchanged', () => {
    const result = flattenParams({ q: '*:*', rows: '10', start: '0' });
    expect(result).toEqual({ q: '*:*', rows: '10', start: '0' });
  });

  it('drops null and undefined values', () => {
    const result = flattenParams({ q: 'test', fl: undefined, sort: undefined });
    expect(result).toEqual({ q: 'test' });
  });

  it('handles empty arrays as empty strings', () => {
    const result = flattenParams({ fl: [] });
    expect(result).toEqual({ fl: '' });
  });

  it('handles single-element arrays', () => {
    const result = flattenParams({ fl: ['bibcode'] });
    expect(result).toEqual({ fl: 'bibcode' });
  });

  it('returns empty object for empty input', () => {
    expect(flattenParams({})).toEqual({});
  });
});

describe('isAllowedPath', () => {
  it('allows /search/query', () => {
    expect(isAllowedPath('/search/query')).toBe(true);
  });

  it('allows resolver paths with resources', () => {
    expect(isAllowedPath('/resolver/2024ApJ...123A/esources')).toBe(true);
  });

  it('allows resolver bibcode only', () => {
    expect(isAllowedPath('/resolver/2024ApJ...123A')).toBe(true);
  });

  it('rejects non-allowlisted paths', () => {
    expect(isAllowedPath('/accounts/bootstrap')).toBe(false);
    expect(isAllowedPath('/biblib/libraries')).toBe(false);
    expect(isAllowedPath('/vault/user-data')).toBe(false);
    expect(isAllowedPath('/orcid/preferences')).toBe(false);
  });

  it('rejects empty path', () => {
    expect(isAllowedPath('')).toBe(false);
  });

  it('rejects path traversal attempts', () => {
    expect(isAllowedPath('/search/query/../accounts/bootstrap')).toBe(false);
  });
});
