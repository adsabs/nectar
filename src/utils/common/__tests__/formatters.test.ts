import { describe, test, expect } from 'vitest';
import { getFormattedNumericPubdate, getFormattedCitationDate } from '../formatters';

describe('getFormattedNumericPubdate', () => {
  test('formats full date as YYYY/MM', () => {
    expect(getFormattedNumericPubdate('2014-04-15')).toBe('2014/04');
  });

  test('formats date with zero month as YYYY', () => {
    expect(getFormattedNumericPubdate('2014-00-00')).toBe('2014');
  });

  test('returns null for invalid date', () => {
    expect(getFormattedNumericPubdate('invalid')).toBeNull();
  });

  test('handles single digit month with leading zero', () => {
    expect(getFormattedNumericPubdate('2014-01-15')).toBe('2014/01');
  });
});

describe('getFormattedCitationDate', () => {
  test('formats full date as MM/YYYY', () => {
    expect(getFormattedCitationDate('2014-04-15')).toBe('04/2014');
  });

  test('formats date with zero month as YYYY only', () => {
    expect(getFormattedCitationDate('2014-00-00')).toBe('2014');
  });

  test('returns null for invalid date', () => {
    expect(getFormattedCitationDate('invalid')).toBeNull();
  });

  test('handles single digit month with leading zero', () => {
    expect(getFormattedCitationDate('2014-01-15')).toBe('01/2014');
  });

  test('handles December correctly', () => {
    expect(getFormattedCitationDate('2014-12-31')).toBe('12/2014');
  });

  test('handles various month formats', () => {
    expect(getFormattedCitationDate('2020-03-00')).toBe('03/2020');
    expect(getFormattedCitationDate('2020-11-00')).toBe('11/2020');
  });

  test('returns year only when month is 00', () => {
    expect(getFormattedCitationDate('2023-00-00')).toBe('2023');
  });
});
