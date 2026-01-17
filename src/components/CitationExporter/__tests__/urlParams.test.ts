import { describe, it, expect } from 'vitest';
import {
  parseExportUrlParams,
  hasExportUrlParams,
  serializeExportUrlParams,
  exportParamsEqual,
  ParsedExportUrlParams,
} from '../urlParams';
import { ExportApiJournalFormat } from '@/api/export/types';

describe('parseExportUrlParams', () => {
  it('returns empty object for empty query', () => {
    const result = parseExportUrlParams({});
    expect(result).toEqual({});
  });

  it('parses customFormat string', () => {
    const result = parseExportUrlParams({ customFormat: '%1H:%Y:%q' });
    expect(result.customFormat).toBe('%1H:%Y:%q');
  });

  it('ignores empty customFormat', () => {
    const result = parseExportUrlParams({ customFormat: '' });
    expect(result.customFormat).toBeUndefined();
  });

  it('parses authorcutoff as number', () => {
    const result = parseExportUrlParams({ authorcutoff: '10' });
    expect(result.authorcutoff).toBe(10);
  });

  it('handles authorcutoff as number input', () => {
    const result = parseExportUrlParams({ authorcutoff: 5 });
    expect(result.authorcutoff).toBe(5);
  });

  it('ignores invalid authorcutoff', () => {
    const result = parseExportUrlParams({ authorcutoff: 'abc' });
    expect(result.authorcutoff).toBeUndefined();
  });

  it('ignores zero or negative authorcutoff', () => {
    expect(parseExportUrlParams({ authorcutoff: '0' }).authorcutoff).toBeUndefined();
    expect(parseExportUrlParams({ authorcutoff: '-5' }).authorcutoff).toBeUndefined();
  });

  it('parses maxauthor as number', () => {
    const result = parseExportUrlParams({ maxauthor: '200' });
    expect(result.maxauthor).toBe(200);
  });

  it('parses keyformat string', () => {
    const result = parseExportUrlParams({ keyformat: '%R' });
    expect(result.keyformat).toBe('%R');
  });

  it('parses journalformat enum values', () => {
    expect(parseExportUrlParams({ journalformat: '1' }).journalformat).toBe(ExportApiJournalFormat.AASTeXMacros);
    expect(parseExportUrlParams({ journalformat: '2' }).journalformat).toBe(ExportApiJournalFormat.Abbreviations);
    expect(parseExportUrlParams({ journalformat: '3' }).journalformat).toBe(ExportApiJournalFormat.FullName);
  });

  it('ignores invalid journalformat values', () => {
    expect(parseExportUrlParams({ journalformat: '0' }).journalformat).toBeUndefined();
    expect(parseExportUrlParams({ journalformat: '4' }).journalformat).toBeUndefined();
    expect(parseExportUrlParams({ journalformat: 'abc' }).journalformat).toBeUndefined();
  });

  it('handles array values by taking first element', () => {
    const result = parseExportUrlParams({
      customFormat: ['first', 'second'] as unknown as string,
      authorcutoff: [10, 20] as unknown as string,
    });
    expect(result.customFormat).toBe('first');
    expect(result.authorcutoff).toBe(10);
  });

  it('parses all params together', () => {
    const result = parseExportUrlParams({
      customFormat: '%T - %A',
      authorcutoff: '5',
      maxauthor: '10',
      keyformat: '%R',
      journalformat: '2',
    });
    expect(result).toEqual({
      customFormat: '%T - %A',
      authorcutoff: 5,
      maxauthor: 10,
      keyformat: '%R',
      journalformat: ExportApiJournalFormat.Abbreviations,
    });
  });
});

describe('hasExportUrlParams', () => {
  it('returns false for empty params', () => {
    expect(hasExportUrlParams({})).toBe(false);
  });

  it('returns true when any param is present', () => {
    expect(hasExportUrlParams({ customFormat: 'test' })).toBe(true);
    expect(hasExportUrlParams({ authorcutoff: 5 })).toBe(true);
    expect(hasExportUrlParams({ maxauthor: 10 })).toBe(true);
    expect(hasExportUrlParams({ keyformat: '%R' })).toBe(true);
    expect(hasExportUrlParams({ journalformat: ExportApiJournalFormat.FullName })).toBe(true);
  });

  it('returns true when multiple params are present', () => {
    const params: ParsedExportUrlParams = {
      customFormat: 'test',
      authorcutoff: 5,
    };
    expect(hasExportUrlParams(params)).toBe(true);
  });
});

describe('serializeExportUrlParams', () => {
  it('returns empty object for empty params', () => {
    expect(serializeExportUrlParams({})).toEqual({});
  });

  it('serializes all params to strings', () => {
    const result = serializeExportUrlParams({
      customFormat: '%T - %A',
      authorcutoff: 5,
      maxauthor: 10,
      keyformat: '%R',
      journalformat: ExportApiJournalFormat.Abbreviations,
    });
    expect(result).toEqual({
      customFormat: '%T - %A',
      authorcutoff: '5',
      maxauthor: '10',
      keyformat: '%R',
      journalformat: '2',
    });
  });

  it('only includes defined params', () => {
    const result = serializeExportUrlParams({
      authorcutoff: 5,
    });
    expect(result).toEqual({ authorcutoff: '5' });
    expect(result.customFormat).toBeUndefined();
  });
});

describe('exportParamsEqual', () => {
  it('returns true for equal empty params', () => {
    expect(exportParamsEqual({}, {})).toBe(true);
  });

  it('returns true for equal params', () => {
    const a = { customFormat: 'test', authorcutoff: 5 };
    const b = { customFormat: 'test', authorcutoff: 5 };
    expect(exportParamsEqual(a, b)).toBe(true);
  });

  it('returns false for different params', () => {
    expect(exportParamsEqual({ authorcutoff: 5 }, { authorcutoff: 10 })).toBe(false);
    expect(exportParamsEqual({ customFormat: 'a' }, { customFormat: 'b' })).toBe(false);
    expect(exportParamsEqual({ authorcutoff: 5 }, {})).toBe(false);
  });
});
