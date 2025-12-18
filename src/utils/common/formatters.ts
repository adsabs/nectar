import { isArray, isNonEmptyString, isNotString } from 'ramda-adjunct';
import { head, pipe, when } from 'ramda';
import DOMPurify from 'isomorphic-dompurify';
import { format, isValid, parseISO } from 'date-fns';
import { logger } from '@/logger';

/**
 * Truncates a decimal number to a specified number of decimal places without rounding.
 *
 * @param {number} num - The number to be truncated.
 * @param {number} d - The number of decimal places to preserve.
 * @returns {number} - The truncated number.
 */
export const truncateDecimal = (num: number, d: number): number => {
  const regex = new RegExp(`^-?\\d+(\\.\\d{0,${d}})?`);
  return parseFloat(regex.exec(num.toString())[0]);
};

/**
 * Regular expression pattern to match a date string in the format YYYY-MM-DD.
 * Captures the year and month as named groups.
 *
 * Named Groups:
 * - year: The four-digit year.
 * - month: The two-digit month.
 *
 * @type {RegExp}
 */
const DATE_REGEX = /^(?<year>\d{4})-(?<month>\d{2})-\d{2}$/;

/**
 * Extracts the year and month from a publication date string.
 *
 * @param {string} pubdate - The publication date string to extract from.
 * @returns {{ year: string; month: string } | null} An object with year and month properties if extraction is successful, or null if the input does not match the expected format.
 */
const extractYearAndMonth = (pubdate: string): { year: string; month: string } | null => {
  const match = DATE_REGEX.exec(pubdate);
  if (match === null) {
    return null;
  }
  const { year, month } = match.groups as { year: string; month: string };
  return { year, month };
};

/**
 * Formats a publication date string into a numeric year/month format.
 *
 * @param {string} pubdate - The publication date in string format.
 * @returns {string | null} - The formatted date as 'YYYY/MM' or null if invalid.
 */
export const getFormattedNumericPubdate = (pubdate: string): string | null => {
  const extractedDate = extractYearAndMonth(pubdate);
  return extractedDate ? `${extractedDate.year}/${extractedDate.month}`.replace('/00', '') : null;
};

/**
 * Formats a publication date string into citation metadata format (MM/YYYY).
 *
 * @param {string} pubdate - The publication date in string format.
 * @returns {string | null} - The formatted date as 'MM/YYYY' or 'YYYY' if month is 00, or null if invalid.
 */
export const getFormattedCitationDate = (pubdate: string): string | null => {
  const extractedDate = extractYearAndMonth(pubdate);
  if (!extractedDate) {
    return null;
  }

  const month = extractedDate.month === '00' ? '' : `${extractedDate.month}/`;
  return month ? `${month}${extractedDate.year}` : extractedDate.year;
};

export const getCleanedPublDate = (pubdate: string): string => {
  if (!pubdate) {
    return pubdate;
  }

  const normalized = pubdate.trim();
  if (normalized === '') {
    return normalized;
  }

  const segments = normalized.split('-');

  if (segments.length === 1) {
    return normalized;
  }

  if (segments.length > 3) {
    return normalized;
  }

  const [year, month, day] = segments;

  if (!/^\d{4}$/.test(year ?? '')) {
    return normalized;
  }

  const parts = [year];

  if (month && month !== '00') {
    parts.push(month);
  }

  if (day && day !== '00' && month && month !== '00') {
    parts.push(day);
  }

  return parts.join('-');
};

/**
 * Formats a publication date string into a more readable format using date-fns.
 *
 * @param {string} pubdate - The publication date in YYYY-MM-DD format.
 * @returns {string} - The formatted date in a human-readable format (e.g., "January 2023", "March 15, 2024").
 */
export const getReadablePublDate = (pubdate: string): string => {
  if (!pubdate) {
    return pubdate;
  }

  const normalized = pubdate.trim();
  if (normalized === '') {
    return pubdate; // Return original input to preserve whitespace
  }

  // Handle year-only format
  if (/^\d{4}$/.test(normalized)) {
    return normalized;
  }

  try {
    const segments = normalized.split('-');

    // Handle partial dates with zero values
    if (segments.length >= 2) {
      const [year, month, day] = segments;

      // Validate year format
      if (!/^\d{4}$/.test(year)) {
        return normalized;
      }

      // If month is '00' or missing, return just the year
      if (!month || month === '00') {
        return year;
      }

      // If month is valid but day is '00' or missing, format as "Month Year"
      if (month !== '00' && (!day || day === '00')) {
        const partialDate = parseISO(`${year}-${month}-01`);
        if (isValid(partialDate)) {
          return format(partialDate, 'MMMM yyyy');
        }
        return normalized;
      }

      // If we have a full date with non-zero day, format as "Month Day, Year"
      if (day && day !== '00') {
        const date = parseISO(normalized);
        if (isValid(date)) {
          return format(date, 'MMMM d, yyyy');
        }
      }
    }

    // Try to parse as a complete date
    const date = parseISO(normalized);
    if (isValid(date)) {
      return format(date, 'MMMM d, yyyy');
    }

    return normalized;
  } catch {
    // If parsing fails, return the original string
    return normalized;
  }
};

/**
 * A function that returns the plural form of a given word based on a specified count.
 *
 * @param {string} str - The word to be pluralized.
 * @param {number} count - The count that determines the plurality of the word.
 * @returns {string} - The original word if the count is 1, otherwise the word with an 's' appended.
 */
export const pluralize = (str: string, count: number) => {
  return count === 1 ? str : `${str}s`;
};

/**
 * Capitalizes the first character of the provided string.
 *
 * @param {string} str - The string to be capitalized.
 * @returns {string} - The capitalized string if input is non-empty, otherwise returns the original string.
 */
export const capitalizeString = (str: string) =>
  isNonEmptyString(str) ? `${str.slice(0, 1).toUpperCase()}${str.slice(1)}` : str;

/**
 * Sanitizes a given string to remove any potential harmful content.
 *
 * This function uses DOMPurify to strip out any malicious code from the provided string,
 * making it safe for insertion into the DOM. If an error occurs during the
 * sanitization process, the original string is returned.
 *
 * @param {string} value - The string value to be sanitized.
 * @returns {string} - The sanitized string.
 */
export const purifyString = (value: string): string => {
  try {
    return DOMPurify.sanitize(value);
  } catch (err) {
    logger.error({ err, value }, 'Error caught sanitizing string');
    return value;
  }
};

/**
 * Strips all HTML tags/attributes from a string while sanitizing.
 * Useful for contexts (like JSON-LD) that expect plain text.
 */
export const stripHtml = (value: string): string => {
  try {
    // Remove all tags and attributes, leaving plain text content
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  } catch (err) {
    logger.error({ err, value }, 'Error caught stripping HTML');
    return value;
  }
};

/**
 * Formats a given number to a string representation with 'k' suffix if the absolute value exceeds 999.
 * If the absolute value is less than or equal to 999, returns the number itself.
 *
 * @param {number} value - The number to be formatted.
 * @returns {string|number} The formatted number as a string with 'k' suffix or the original number.
 */
export const kFormatNumber = (value: number): string | number => {
  const absV = Math.abs(value);
  const sign = Math.sign(value);
  return absV > 999 ? `${sign * (Math.round(absV / 100) / 10)}k` : sign * absV;
};

/**
 * A function that processes an input value, which can be either a string or an array of strings,
 * and returns a string. If the input is an array, it retrieves the first element;
 * if the input is not a string, it returns an empty string.
 */
export const unwrapStringValue = pipe<[string | string[]], string, string>(
  when(isArray, head),
  when(isNotString, () => ''),
);
