import { describe, expect, it } from 'vitest';
import { normalizePubdate, prune } from '../docToJsonld';

describe('normalizePubdate', () => {
  it('returns undefined for falsy or invalid inputs', () => {
    expect(normalizePubdate(undefined)).toBeUndefined();
    expect(normalizePubdate('')).toBeUndefined();
    expect(normalizePubdate('  ')).toBeUndefined();
    expect(normalizePubdate('20x5-03-00')).toBeUndefined();
    expect(normalizePubdate('202-03-00')).toBeUndefined();
    expect(normalizePubdate('2025-13-01')).toBeUndefined();
    expect(normalizePubdate('2025-00-32')).toBeUndefined();
  });

  it('passes through valid values including placeholders', () => {
    expect(normalizePubdate('2025')).toBe('2025');
    expect(normalizePubdate('2025-03')).toBe('2025-03');
    expect(normalizePubdate('2025-03-00')).toBe('2025-03-00');
    expect(normalizePubdate('2025-03-15')).toBe('2025-03-15');
  });
});

describe('prune', () => {
  it('drops undefined, null, empty strings, and empty arrays by default', () => {
    const input: Record<string, unknown> = {
      a: undefined,
      b: null,
      c: '',
      d: '  ',
      e: [],
      f: 0,
      g: false,
      h: { x: 1 },
      i: [1],
    };
    const out = prune(input);
    expect(out).toEqual({ f: 0, g: false, h: { x: 1 }, i: [1] });
  });
});
