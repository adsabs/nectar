import { describe, expect, test } from 'vitest';
import { getBibtexExportParams } from './getBibtexExportParams';
import { ExportApiFormatKey, ExportApiJournalFormat } from './types';
import { IADSApiUserDataResponse } from '@/api/user/types';
import { JournalFormatName, UserDataKeys } from '@/api/user/types';

const makeSettings = (overrides?: Partial<IADSApiUserDataResponse>): IADSApiUserDataResponse =>
  ({
    [UserDataKeys.BIBTEX_FORMAT]: '%1H+%Y',
    [UserDataKeys.ABS_FORMAT]: '%2H+%q',
    [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: JournalFormatName.Abbreviations,
    [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: '5',
    [UserDataKeys.ABS_AUTHOR_CUTOFF]: '6',
    [UserDataKeys.BIBTEX_MAX_AUTHORS]: '10',
    [UserDataKeys.ABS_MAX_AUTHORS]: '11',
    ...overrides,
  } as IADSApiUserDataResponse);

describe('getBibtexExportParams', () => {
  test('includes custom bibtex params for the bibtex format', () => {
    const params = getBibtexExportParams(makeSettings(), ExportApiFormatKey.bibtex);

    expect(params).toEqual({
      keyformat: ['%1H+%Y'],
      journalformat: [ExportApiJournalFormat.Abbreviations],
      authorcutoff: [5],
      maxauthor: [10],
    });
  });

  test('includes ABS-specific bibtex params for the bibtexabs format', () => {
    const params = getBibtexExportParams(makeSettings(), ExportApiFormatKey.bibtexabs);

    expect(params).toEqual({
      keyformat: ['%2H+%q'],
      journalformat: [ExportApiJournalFormat.Abbreviations],
      authorcutoff: [6],
      maxauthor: [11],
    });
  });

  test('returns defaults for an anonymous user (no bibtex settings customized)', () => {
    const params = getBibtexExportParams(
      makeSettings({
        [UserDataKeys.BIBTEX_FORMAT]: '',
        [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: JournalFormatName.AASTeXMacros,
        [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: '200',
        [UserDataKeys.BIBTEX_MAX_AUTHORS]: '10',
      }),
      ExportApiFormatKey.bibtex,
    );

    expect(params).toEqual({
      keyformat: [''],
      journalformat: [ExportApiJournalFormat.AASTeXMacros],
      authorcutoff: [200],
      maxauthor: [10],
    });
  });

  test('returns no bibtex-only params for a non-bibtex format', () => {
    const params = getBibtexExportParams(makeSettings(), ExportApiFormatKey.agu);

    expect(params).toEqual({});
  });

  test('sanitizes keyformat before including it in the params', () => {
    const params = getBibtexExportParams(
      makeSettings({ [UserDataKeys.BIBTEX_FORMAT]: '<script>alert(1)</script>%1H+%Y' }),
      ExportApiFormatKey.bibtex,
    );

    expect(params.keyformat).toEqual(['%1H+%Y']);
  });
});
