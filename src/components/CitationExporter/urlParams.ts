import { ExportApiJournalFormat } from '@/api/export/types';

type QueryValue = string | number | boolean | (string | number)[] | undefined;

/**
 * Parsed and validated export URL parameters with proper types.
 */
export interface ParsedExportUrlParams {
  customFormat?: string;
  authorcutoff?: number;
  maxauthor?: number;
  keyformat?: string;
  journalformat?: ExportApiJournalFormat;
}

/**
 * Extracts a string value from a query parameter.
 */
const getStringValue = (value: QueryValue): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : String(first);
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
};

/**
 * Extracts a number value from a query parameter.
 */
const getNumberValue = (value: QueryValue): number | undefined => {
  if (typeof value === 'number') {
    return value;
  }
  const str = getStringValue(value);
  if (str !== undefined) {
    const parsed = parseInt(str, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

/**
 * Parses URL query parameters into typed export options.
 * Returns undefined for missing or invalid values.
 */
export const parseExportUrlParams = (query: Record<string, QueryValue>): ParsedExportUrlParams => {
  const result: ParsedExportUrlParams = {};

  // customFormat - string, may contain % characters (URI-decoded by Next.js)
  const customFormat = getStringValue(query.customFormat);
  if (customFormat && customFormat.length > 0) {
    result.customFormat = customFormat;
  }

  // authorcutoff - positive integer
  const authorcutoff = getNumberValue(query.authorcutoff);
  if (authorcutoff !== undefined && authorcutoff > 0) {
    result.authorcutoff = authorcutoff;
  }

  // maxauthor - positive integer
  const maxauthor = getNumberValue(query.maxauthor);
  if (maxauthor !== undefined && maxauthor > 0) {
    result.maxauthor = maxauthor;
  }

  // keyformat - string, typically %R or similar
  const keyformat = getStringValue(query.keyformat);
  if (keyformat && keyformat.length > 0) {
    result.keyformat = keyformat;
  }

  // journalformat - enum value (1, 2, or 3)
  const journalformat = getNumberValue(query.journalformat);
  if (journalformat === 1 || journalformat === 2 || journalformat === 3) {
    result.journalformat = journalformat as ExportApiJournalFormat;
  }

  return result;
};

/**
 * Checks if any URL export params are present.
 */
export const hasExportUrlParams = (params: ParsedExportUrlParams): boolean => {
  return (
    params.customFormat !== undefined ||
    params.authorcutoff !== undefined ||
    params.maxauthor !== undefined ||
    params.keyformat !== undefined ||
    params.journalformat !== undefined
  );
};

/**
 * Serializes export params to URL query string format.
 * Only includes params that are defined.
 */
export const serializeExportUrlParams = (params: ParsedExportUrlParams): Record<string, string> => {
  const result: Record<string, string> = {};

  if (params.customFormat !== undefined) {
    result.customFormat = params.customFormat;
  }
  if (params.authorcutoff !== undefined) {
    result.authorcutoff = String(params.authorcutoff);
  }
  if (params.maxauthor !== undefined) {
    result.maxauthor = String(params.maxauthor);
  }
  if (params.keyformat !== undefined) {
    result.keyformat = params.keyformat;
  }
  if (params.journalformat !== undefined) {
    result.journalformat = String(params.journalformat);
  }

  return result;
};

/**
 * Compares two ParsedExportUrlParams for equality.
 */
export const exportParamsEqual = (a: ParsedExportUrlParams, b: ParsedExportUrlParams): boolean => {
  return (
    a.customFormat === b.customFormat &&
    a.authorcutoff === b.authorcutoff &&
    a.maxauthor === b.maxauthor &&
    a.keyformat === b.keyformat &&
    a.journalformat === b.journalformat
  );
};
