import { describe, expect, test } from 'vitest';
import { isOrcidProfileEntry, isValidIOrcidUser, isValidOrcidId } from './models';

describe('isValidOrcidId', () => {
  test('returns true for valid ORCID ids', () => {
    expect(isValidOrcidId('0000-0002-1825-0097')).toBe(true);
    expect(isValidOrcidId('1234-5678-9012-345X')).toBe(true);
  });

  test('returns false for malformed ORCID ids', () => {
    expect(isValidOrcidId('0000-0002-1825-009')).toBe(false);
    expect(isValidOrcidId('0000-0002-1825-00977')).toBe(false);
    expect(isValidOrcidId('0000000218250097')).toBe(false);
    expect(isValidOrcidId('0000-0002-1825-009x')).toBe(false);
    expect(isValidOrcidId('abcd-0002-1825-0097')).toBe(false);
  });

  test('returns false for non-string values', () => {
    expect(isValidOrcidId(null)).toBe(false);
    expect(isValidOrcidId(undefined)).toBe(false);
    expect(isValidOrcidId(1234)).toBe(false);
    expect(isValidOrcidId({})).toBe(false);
  });
});

describe('isValidIOrcidUser', () => {
  const validUser = {
    access_token: 'token',
    expires_in: 3600,
    name: 'Ada Lovelace',
    orcid: '0000-0002-1825-0097',
    refresh_token: 'refresh',
    scope: '/read-limited',
    token_type: 'bearer',
  };

  test('returns true for a valid ORCID user object', () => {
    expect(isValidIOrcidUser(validUser)).toBe(true);
  });

  test('returns true for boundary numeric values that still produce a valid date', () => {
    expect(isValidIOrcidUser({ ...validUser, expires_in: 0 })).toBe(true);
    expect(isValidIOrcidUser({ ...validUser, expires_in: -1 })).toBe(true);
  });

  test('returns false when required keys are missing', () => {
    const { refresh_token, ...missingRefreshToken } = validUser;

    expect(isValidIOrcidUser(missingRefreshToken)).toBe(false);
  });

  test('returns false for non-object values', () => {
    expect(isValidIOrcidUser(null)).toBe(false);
    expect(isValidIOrcidUser(undefined)).toBe(false);
    expect(isValidIOrcidUser('user')).toBe(false);
    expect(isValidIOrcidUser([])).toBe(false);
  });

  test('returns false when any required property has the wrong type', () => {
    expect(isValidIOrcidUser({ ...validUser, access_token: 123 })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, expires_in: '3600' })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, name: false })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, orcid: 12 })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, refresh_token: null })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, scope: {} })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, token_type: [] })).toBe(false);
  });

  test('returns false when expires_in produces an invalid date', () => {
    expect(isValidIOrcidUser({ ...validUser, expires_in: NaN })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, expires_in: Infinity })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, expires_in: -Infinity })).toBe(false);
    expect(isValidIOrcidUser({ ...validUser, expires_in: Number.MAX_SAFE_INTEGER })).toBe(false);
  });
});

describe('isOrcidProfileEntry', () => {
  const validEntry = {
    identifier: '2024MNRAS.123..456A',
    status: 'verified',
    title: 'A valid ORCID profile entry',
    pubyear: '2024',
    pubmonth: '06',
    updated: '2024-06-02',
    putcode: '12345',
    source: ['ADS', 'ORCID'],
  };

  test('returns true for a fully valid profile entry', () => {
    expect(isOrcidProfileEntry(validEntry)).toBe(true);
  });

  test('returns true for allowed status values and nullable fields', () => {
    expect(isOrcidProfileEntry({ ...validEntry, status: 'not in ADS', pubyear: null, pubmonth: null })).toBe(true);
    expect(isOrcidProfileEntry({ ...validEntry, status: 'pending', pubmonth: undefined })).toBe(true);
    expect(isOrcidProfileEntry({ ...validEntry, status: 'rejected', putcode: 12345 })).toBe(true);
  });

  test('returns false for nil or empty entries', () => {
    expect(isOrcidProfileEntry(null)).toBe(false);
    expect(isOrcidProfileEntry(undefined)).toBe(false);
    expect(isOrcidProfileEntry('')).toBe(false);
    expect(isOrcidProfileEntry({})).toBe(false);
    expect(isOrcidProfileEntry([])).toBe(false);
  });

  test('returns false when required scalar fields have the wrong type', () => {
    expect(isOrcidProfileEntry({ ...validEntry, identifier: 123 })).toBe(false);
    expect(isOrcidProfileEntry({ ...validEntry, title: 123 })).toBe(false);
    expect(isOrcidProfileEntry({ ...validEntry, updated: 123 })).toBe(false);
    expect(isOrcidProfileEntry({ ...validEntry, putcode: true })).toBe(false);
  });

  test('returns false for invalid status values', () => {
    expect(isOrcidProfileEntry({ ...validEntry, status: 'unknown' })).toBe(false);
    expect(isOrcidProfileEntry({ ...validEntry, status: null })).toBe(false);
  });

  test('returns false when source is not an array of strings', () => {
    expect(isOrcidProfileEntry({ ...validEntry, source: 'ADS' })).toBe(false);
    expect(isOrcidProfileEntry({ ...validEntry, source: ['ADS', 1] })).toBe(false);
  });

  test('returns false when pubmonth has the wrong type', () => {
    expect(isOrcidProfileEntry({ ...validEntry, pubmonth: 6 })).toBe(false);
  });

  test('accepts a non-string pubyear when pubmonth is undefined because of the current implementation', () => {
    expect(isOrcidProfileEntry({ ...validEntry, pubyear: 2024, pubmonth: undefined })).toBe(true);
  });
});
