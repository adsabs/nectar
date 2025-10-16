import { describe, expect, it } from 'vitest';
import { getReadablePublDate } from '../formatters';

describe('getReadablePublDate', () => {
  it('should return empty string for empty input', () => {
    expect(getReadablePublDate('')).toBe('');
    expect(getReadablePublDate('   ')).toBe('   ');
  });

  it('should return original value for non-date strings', () => {
    expect(getReadablePublDate('not-a-date')).toBe('not-a-date');
    expect(getReadablePublDate('2024-13-01')).toBe('2024-13-01'); // Invalid month
  });

  it('should format year-only dates', () => {
    expect(getReadablePublDate('2024')).toBe('2024');
  });

  it('should format year-month dates', () => {
    expect(getReadablePublDate('2024-01')).toBe('January 2024');
    expect(getReadablePublDate('2024-03')).toBe('March 2024');
    expect(getReadablePublDate('2024-12')).toBe('December 2024');
  });

  it('should format full dates', () => {
    expect(getReadablePublDate('2024-01-15')).toBe('January 15, 2024');
    expect(getReadablePublDate('2024-03-01')).toBe('March 1, 2024');
    expect(getReadablePublDate('2024-12-31')).toBe('December 31, 2024');
  });

  it('should handle zero values correctly', () => {
    expect(getReadablePublDate('2024-00')).toBe('2024');
    expect(getReadablePublDate('2024-01-00')).toBe('January 2024');
    expect(getReadablePublDate('2024-00-00')).toBe('2024');
  });

  it('should handle null and undefined inputs', () => {
    expect(getReadablePublDate(null as unknown as string)).toBe(null);
    expect(getReadablePublDate(undefined as unknown as string)).toBe(undefined);
  });
});
