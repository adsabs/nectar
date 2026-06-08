import { describe, expect, test } from 'vitest';
import { IOrcidProfile } from '@/api/orcid/types';
import { findPutcodeInProfile, getFulfilled, getRejected } from './useRemoveWorks';

const createProfileEntry = (putcode: string | number) => ({
  identifier: `id-${putcode}`,
  status: 'verified' as const,
  title: `Title ${putcode}`,
  pubyear: '2024',
  pubmonth: '06',
  updated: '2024-06-03',
  putcode,
  source: ['ADS'],
});

describe('getFulfilled', () => {
  test('returns keys for fulfilled entries when results are mixed', () => {
    const entries: Record<string, PromiseSettledResult<void>> = {
      alpha: { status: 'fulfilled', value: undefined },
      beta: { status: 'rejected', reason: new Error('failed') },
      gamma: { status: 'fulfilled', value: undefined },
    };

    expect(getFulfilled(entries)).toStrictEqual(['alpha', 'gamma']);
  });

  test('returns all keys when every entry is fulfilled', () => {
    const entries: Record<string, PromiseSettledResult<void>> = {
      alpha: { status: 'fulfilled', value: undefined },
      beta: { status: 'fulfilled', value: undefined },
    };

    expect(getFulfilled(entries)).toStrictEqual(['alpha', 'beta']);
  });

  test('returns an empty array when every entry is rejected', () => {
    const entries: Record<string, PromiseSettledResult<void>> = {
      alpha: { status: 'rejected', reason: new Error('failed') },
      beta: { status: 'rejected', reason: new Error('failed again') },
    };

    expect(getFulfilled(entries)).toStrictEqual([]);
  });

  test('returns an empty array for an empty object', () => {
    expect(getFulfilled({})).toStrictEqual([]);
  });
});

describe('getRejected', () => {
  test('returns keys for rejected entries when results are mixed', () => {
    const entries: Record<string, PromiseSettledResult<void>> = {
      alpha: { status: 'fulfilled', value: undefined },
      beta: { status: 'rejected', reason: new Error('failed') },
      gamma: { status: 'rejected', reason: new Error('failed again') },
    };

    expect(getRejected(entries)).toStrictEqual(['beta', 'gamma']);
  });

  test('returns an empty array when every entry is fulfilled', () => {
    const entries: Record<string, PromiseSettledResult<void>> = {
      alpha: { status: 'fulfilled', value: undefined },
      beta: { status: 'fulfilled', value: undefined },
    };

    expect(getRejected(entries)).toStrictEqual([]);
  });

  test('returns all keys when every entry is rejected', () => {
    const entries: Record<string, PromiseSettledResult<void>> = {
      alpha: { status: 'rejected', reason: new Error('failed') },
      beta: { status: 'rejected', reason: new Error('failed again') },
    };

    expect(getRejected(entries)).toStrictEqual(['alpha', 'beta']);
  });

  test('returns an empty array for an empty object', () => {
    expect(getRejected({})).toStrictEqual([]);
  });
});

describe('findPutcodeInProfile', () => {
  test('finds a matching entry using numeric comparison across string and number putcodes', () => {
    const profile: IOrcidProfile = {
      first: createProfileEntry(101),
      second: createProfileEntry('202'),
    };

    expect(findPutcodeInProfile('101', profile)).toBe('first');
    expect(findPutcodeInProfile('202', profile)).toBe('second');
  });

  test('returns undefined when no entry matches the putcode', () => {
    const profile: IOrcidProfile = {
      first: createProfileEntry('101'),
      second: createProfileEntry(202),
    };

    expect(findPutcodeInProfile('999', profile)).toBeUndefined();
  });

  test('returns the first matching entry key when multiple entries share the same numeric putcode', () => {
    const profile: IOrcidProfile = {
      first: createProfileEntry('101'),
      second: createProfileEntry(101),
      third: createProfileEntry('303'),
    };

    expect(findPutcodeInProfile('101', profile)).toBe('first');
  });
});
