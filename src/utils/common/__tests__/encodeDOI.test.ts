import { describe, expect, it } from 'vitest';
import { encodeDOIPath } from '../encodeDOI';

describe('encodeDOIPath', () => {
  it('encodes # as %23', () => {
    expect(encodeDOIPath('10.1002/1521-3994(199908)320:4/5<163::AID-ASNA163>3.0.CO;2-#')).toBe(
      '10.1002/1521-3994(199908)320%3A4/5%3C163%3A%3AAID-ASNA163%3E3.0.CO%3B2-%23',
    );
  });

  it('encodes < and > as %3C and %3E', () => {
    expect(encodeDOIPath('10.1000/foo<bar>baz')).toBe('10.1000/foo%3Cbar%3Ebaz');
  });

  it('encodes ? as %3F', () => {
    expect(encodeDOIPath('10.1000/foo?bar')).toBe('10.1000/foo%3Fbar');
  });

  it('encodes space as %20', () => {
    expect(encodeDOIPath('10.1000/foo bar')).toBe('10.1000/foo%20bar');
  });

  it('preserves / as a path separator', () => {
    expect(encodeDOIPath('10.48550/arXiv.2507.19320')).toBe('10.48550/arXiv.2507.19320');
  });

  it('does not double-encode already-encoded sequences', () => {
    // % itself gets encoded to %25, preventing double-encoding
    expect(encodeDOIPath('10.1000/foo%23bar')).toBe('10.1000/foo%2523bar');
  });

  it('leaves a plain DOI unchanged', () => {
    expect(encodeDOIPath('10.1086/345794')).toBe('10.1086/345794');
  });
});
