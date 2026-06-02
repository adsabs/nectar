/**
 * Encodes a DOI value for safe insertion into a URL path.
 *
 * Uses encodeURIComponent to encode all URL-unsafe characters (#, ?, <, >, [, ],
 * spaces, etc.) then restores '/' which is a legitimate path separator in both
 * doi.org URLs and ADS gateway URLs.
 */
export function encodeDOIPath(doi: string): string {
  return encodeURIComponent(doi).replace(/%2F/gi, '/');
}
