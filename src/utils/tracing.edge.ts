import { TRACING_HEADERS } from '@/config';
import { sanitizeHeaderValue } from '@/utils/logging';

/**
 * Extracts tracing headers from a Fetch API Headers object (edge runtime).
 *
 * Headers.get() is case-insensitive per the Fetch spec.
 * Values are sanitized to remove control characters (log injection prevention).
 */
export const pickTracingHeadersEdge = (headers: Headers): Record<string, string> => {
  return TRACING_HEADERS.reduce((acc, key) => {
    const value = headers.get(key);
    if (value) {
      acc[key] = sanitizeHeaderValue(value);
    }
    return acc;
  }, {} as Record<string, string>);
};
