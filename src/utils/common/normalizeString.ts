/**
 * Normalizes a string into snake_case format.
 *
 * This function:
 * - Converts the input to lowercase
 * - Removes all non-alphanumeric characters (except spaces)
 * - Replaces whitespace with underscores
 *
 * Useful for generating safe, consistent keys, filenames, or event tags.
 *
 * @param {string} input - The input string to normalize.
 * @returns {string} The normalized snake_case string.
 *
 * @example
 * normalizeString("Astrophysics - Instrumentation & Methods");
 * // returns "astrophysics_instrumentation_methods"
 */
export const normalizeString = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
};
