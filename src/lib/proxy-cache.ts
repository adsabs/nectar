const CACHE_PREFIX = 'scix:cache';

export function flattenParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }
    out[key] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return out;
}

export function buildCacheKey(method: string, path: string, params: Record<string, string>): string {
  const upperMethod = method.toUpperCase();
  const sortedKeys = Object.keys(params).sort((a, b) => a.localeCompare(b));

  const query = sortedKeys
    .map((key) => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(params[key]);
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');

  const baseKey = `${CACHE_PREFIX}:${upperMethod}:${path}`;
  return query ? `${baseKey}?${query}` : baseKey;
}

const ALLOWED_PATTERNS = [/^\/search\/query$/, /^\/resolver\/.+$/];

export function isAllowedPath(path: string): boolean {
  if (!path) {
    return false;
  }

  const hasTraversal = path.split('/').some((segment) => segment === '..');
  if (hasTraversal) {
    return false;
  }

  return ALLOWED_PATTERNS.some((pattern) => pattern.test(path));
}
