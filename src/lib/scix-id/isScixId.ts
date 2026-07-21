// Detects a scix_id-shaped identifier (e.g. "scix:6NEE-CD2G-T0JE"). Pure and
// dependency-free so it is safe to import in server/edge code paths (routing,
// param builders) without pulling in the client fallback store.
export const isScixId = (id: string): boolean => id.startsWith('scix:');
