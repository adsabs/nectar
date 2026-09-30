/**
 * A single fq/fq_* URL param parses as a bare string rather than an array;
 * normalize before treating a value as a list.
 *
 * Kept free of imports: searchMode.ts, query-utils.ts and SearchFacet
 * helpers all need it, and routing it through any of them drags that
 * module's graph into the others.
 */
export const safeGetArray = (val: string | string[]): string[] =>
  Array.isArray(val) ? val : typeof val === 'string' ? [val] : [];
