/**
 * Logging utilities for privacy-safe and secure logging
 */

/**
 * Creates a non-reversible hash of a username for correlation without exposing PII
 * @param username - User email/username to hash
 * @returns First 12 characters of SHA-256 hash (undefined if no username)
 */
export const getUserLogId = async (username?: string): Promise<string | undefined> => {
  if (!username) return undefined;

  const buffer = await globalThis.crypto.subtle.digest('SHA-256', Buffer.from(username, 'utf-8'));
  const hash = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Return first 12 chars - enough for correlation, not reversible
  return hash.substring(0, 12);
};

/**
 * Sanitizes header values to prevent log injection attacks
 * - Removes control characters (newlines, tabs, null bytes, ANSI codes)
 * @param value - Header value to sanitize
 * @returns Sanitized string, empty string if null
 */
export const sanitizeHeaderValue = (value: string | null): string => {
  if (!value) return '';

  // Remove control characters (newlines, tabs, null bytes, ANSI codes)
  // This prevents log injection while preserving the full header value for tracing
  return value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
};

/**
 * Sanitizes all header values in a record
 * @param headers - Record of header key-value pairs
 * @returns Record with sanitized values
 */
export const sanitizeHeaders = (headers: Record<string, string>): Record<string, string> => {
  return Object.entries(headers).reduce(
    (acc, [key, value]) => {
      acc[key] = sanitizeHeaderValue(value);
      return acc;
    },
    {} as Record<string, string>,
  );
};
