import { describe, expect, test } from 'vitest';
import type { IOrcidProfile } from '@/api/orcid/types';
import type { IDocsEntity } from '@/api/search/types';
import { convertDocType, findWorkInProfile, mergeOrcidMissingRecords } from './helpers';

const createProfileEntry = (identifier: string) => ({
  identifier,
  status: 'verified' as const,
  title: `Title for ${identifier}`,
  pubyear: '2024',
  pubmonth: '06',
  updated: '2024-06-03',
  putcode: `putcode-${identifier}`,
  source: ['ADS'],
});

const createDoc = (overrides: Partial<IDocsEntity>): IDocsEntity =>
  ({
    identifier: ['bibcode:default'],
    pubdate: '2024-06-03',
    title: ['Default title'],
    ...overrides,
  } as IDocsEntity);

describe('convertDocType', () => {
  test.each([
    ['article', 'JOURNAL_ARTICLE'],
    ['inproceedings', 'CONFERENCE_PAPER'],
    ['abstract', 'CONFERENCE_ABSTRACT'],
    ['eprint', 'WORKING_PAPER'],
    ['phdthesis', 'DISSERTATION'],
    ['techreport', 'RESEARCH_TECHNIQUE'],
    ['inbook', 'BOOK_CHAPTER'],
    ['circular', 'RESEARCH_TOOL'],
    ['book', 'BOOK'],
    ['proceedings', 'BOOK'],
    ['bookreview', 'BOOK_REVIEW'],
    ['erratum', 'JOURNAL_ARTICLE'],
    ['newsletter', 'NEWSLETTER_ARTICLE'],
    ['catalog', 'DATA-SET'],
    ['intechreport', 'RESEARCH_TECHNIQUE'],
    ['mastersthesis', 'DISSERTATION'],
    ['software', 'RESEARCH_TECHNIQUE'],
    ['talk', 'LECTURE_SPEECH'],
    ['dataset', 'DATA-SET'],
    ['instrument', 'PHYSICAL-OBJECT'],
    ['service', 'DATA-SET'],
    ['obituary', 'OTHER'],
    ['pressrelease', 'OTHER'],
    ['proposal', 'OTHER'],
    ['editorial', 'OTHER'],
    ['misc', 'OTHER'],
    ['unknown-doc-type', 'OTHER'],
  ])('maps %s to %s', (docType, expected) => {
    expect(convertDocType(docType)).toBe(expected);
  });
});

describe('findWorkInProfile', () => {
  const profile: IOrcidProfile = {
    alpha: createProfileEntry('alpha'),
    beta: createProfileEntry('beta'),
  };

  test.each([
    [null, profile],
    ['', profile],
    [[], profile],
    ['alpha', null],
    ['alpha', {}],
  ])('returns null for nil or empty inputs: %j', (identifier, currentProfile) => {
    expect(findWorkInProfile(identifier as string | string[], currentProfile as IOrcidProfile)).toBeNull();
  });

  test('returns the matching profile entry for a string identifier', () => {
    expect(findWorkInProfile('alpha', profile)).toBe(profile.alpha);
  });

  test('returns null when a string identifier is not in the profile', () => {
    expect(findWorkInProfile('missing', profile)).toBeNull();
  });

  test('returns the first matching entry when given an identifier array', () => {
    expect(findWorkInProfile(['missing', 'beta', 'alpha'], profile)).toBe(profile.beta);
  });

  test('returns null when no identifiers in the array match the profile', () => {
    expect(findWorkInProfile(['missing', 'also-missing'], profile)).toBeNull();
  });
});

describe('mergeOrcidMissingRecords', () => {
  test('adds only docs whose identifiers are not already present in the profile', () => {
    const existingEntry = createProfileEntry('existing:bibcode');
    const profile: IOrcidProfile = {
      'existing:bibcode': existingEntry,
    };
    const missing: IDocsEntity[] = [
      createDoc({
        identifier: ['existing:bibcode', 'alt:existing'],
        pubdate: '2024-01-15',
        title: ['Existing title should be ignored'],
      }),
      createDoc({
        identifier: ['new:bibcode', 'alt:new'],
        pubdate: '2024-02-20',
        title: ['New title'],
      }),
    ];

    const merged = mergeOrcidMissingRecords(missing, profile);

    expect(merged).toStrictEqual({
      'existing:bibcode': existingEntry,
      'new:bibcode': {
        identifier: 'new:bibcode',
        pubyear: '2024',
        pubmonth: '02',
        putcode: null,
        source: [],
        status: null,
        title: 'New title',
        updated: null,
      },
    });
    expect(merged['existing:bibcode']).toBe(existingEntry);
  });

  test('preserves the original profile entries unchanged when every missing doc already exists', () => {
    const existingEntry = createProfileEntry('existing:bibcode');
    const profile: IOrcidProfile = {
      'existing:bibcode': existingEntry,
    };
    const missing: IDocsEntity[] = [
      createDoc({
        identifier: ['other:id', 'existing:bibcode'],
        pubdate: '2023-12',
        title: ['Should not be merged'],
      }),
    ];

    const merged = mergeOrcidMissingRecords(missing, profile);

    expect(merged).toStrictEqual(profile);
    expect(merged['existing:bibcode']).toBe(existingEntry);
  });

  test('uses the first identifier and first title when creating a new profile entry', () => {
    const merged = mergeOrcidMissingRecords(
      [
        createDoc({
          identifier: ['primary:id', 'secondary:id'],
          pubdate: '2023-12',
          title: ['Primary title', 'Secondary title'],
        }),
      ],
      {},
    );

    expect(merged).toStrictEqual({
      'primary:id': {
        identifier: 'primary:id',
        pubyear: '2023',
        pubmonth: '12',
        putcode: null,
        source: [],
        status: null,
        title: 'Primary title',
        updated: null,
      },
    });
  });
});
