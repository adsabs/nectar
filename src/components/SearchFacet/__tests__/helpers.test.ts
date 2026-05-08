import { describe, expect, it } from 'vitest';
import { formatFacetCSV } from '../helpers';
import { FacetItem } from '../types';

const item = (val: string, count: number): FacetItem => ({
  id: val,
  val,
  count,
  parentId: null,
  level: 0,
});

describe('formatFacetCSV', () => {
  it('returns only the header for an empty list', () => {
    expect(formatFacetCSV([])).toBe('Label,Count');
  });

  it('strips the hierarchical prefix from the label', () => {
    const result = formatFacetCSV([item('0/Smith, J', 42)]);
    expect(result).toBe('Label,Count\n"Smith, J",42');
  });

  it('includes the count column', () => {
    const result = formatFacetCSV([item('0/Jones, B', 7)]);
    expect(result).toContain(',7');
  });

  it('handles deeper hierarchy levels', () => {
    const result = formatFacetCSV([item('1/Smith, J/Smith, John', 5)]);
    expect(result).toBe('Label,Count\n"Smith, John",5');
  });

  it('escapes double-quotes in labels per RFC 4180', () => {
    const result = formatFacetCSV([item('0/He said "hi"', 1)]);
    expect(result).toBe('Label,Count\n"He said ""hi""",1');
  });

  it('wraps labels containing commas in quotes', () => {
    const result = formatFacetCSV([item('0/Doe, Jane', 10)]);
    expect(result).toBe('Label,Count\n"Doe, Jane",10');
  });

  it('handles non-hierarchical keys (no slash)', () => {
    const result = formatFacetCSV([item('astronomy', 100)]);
    expect(result).toBe('Label,Count\n"astronomy",100');
  });

  it('produces one row per item', () => {
    const items = [item('0/Alpha', 3), item('0/Beta', 7), item('0/Gamma', 1)];
    const lines = formatFacetCSV(items).split('\n');
    expect(lines).toHaveLength(4); // header + 3 rows
    expect(lines[0]).toBe('Label,Count');
    expect(lines[1]).toBe('"Alpha",3');
    expect(lines[2]).toBe('"Beta",7');
    expect(lines[3]).toBe('"Gamma",1');
  });
});
