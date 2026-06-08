import { describe, expect, test } from 'vitest';
import { encodeDOIPath } from '../encodeDOI';

describe('encodeDOIPath', () => {
  test('encodes # as %23', () => {
    expect(encodeDOIPath('10.1002/1521-3994(199908)320:4/5<163::AID-ASNA163>3.0.CO;2-#')).toBe(
      '10.1002/1521-3994(199908)320%3A4/5%3C163%3A%3AAID-ASNA163%3E3.0.CO%3B2-%23',
    );
  });

  test('encodes < and > as %3C and %3E', () => {
    expect(encodeDOIPath('10.1000/foo<bar>baz')).toBe('10.1000/foo%3Cbar%3Ebaz');
  });

  test('encodes ? as %3F', () => {
    expect(encodeDOIPath('10.1000/foo?bar')).toBe('10.1000/foo%3Fbar');
  });

  test('encodes space as %20', () => {
    expect(encodeDOIPath('10.1000/foo bar')).toBe('10.1000/foo%20bar');
  });

  test('preserves / as a path separator', () => {
    expect(encodeDOIPath('10.48550/arXiv.2507.19320')).toBe('10.48550/arXiv.2507.19320');
  });

  test('encodes a literal % to %25, so a pre-encoded sequence is re-encoded', () => {
    // A literal '%' is encoded to '%25'; an already-encoded '%23' therefore
    // becomes '%2523', keeping the value safe for use in a URL path.
    expect(encodeDOIPath('10.1000/foo%23bar')).toBe('10.1000/foo%2523bar');
  });

  test('leaves a plain DOI unchanged', () => {
    expect(encodeDOIPath('10.1086/345794')).toBe('10.1086/345794');
  });
});
