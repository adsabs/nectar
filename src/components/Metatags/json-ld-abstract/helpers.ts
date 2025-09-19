/**
 * Ensure a value is wrapped as an array.
 */
export function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) {
    return v as T[];
  }
  if (v === undefined || v === null) {
    return [];
  }
  return [v as T];
}
