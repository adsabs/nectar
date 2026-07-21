// EXPERIMENTAL (SCIX-904): the seam helpers stay after the migration; only the
// fallback reporting they trigger is throwaway instrumentation.
import type { IDocsEntity } from '@/api/search/types';
import { record } from './fallbackStore';

type CanonicalDoc = Pick<IDocsEntity, 'scix_id' | 'bibcode'>;

interface CanonicalCtx {
  surface: string;
}

// Prefer scix_id; fall back to bibcode and record the gap when it is absent.
export const getCanonicalId = (doc: CanonicalDoc, ctx: CanonicalCtx): string => {
  if (doc.scix_id) {
    return doc.scix_id;
  }
  record({ reason: 'no-scix-id', surface: ctx.surface, bibcode: doc.bibcode });
  return doc.bibcode ?? '';
};

export const getEncodedCanonicalId = (doc: CanonicalDoc, ctx: CanonicalCtx): string =>
  encodeURIComponent(getCanonicalId(doc, ctx));

// Always sends bibcode. Records the gap when we had a scix_id but the backend
// still forced us to send bibcode.
export const bibcodeForApi = (doc: CanonicalDoc, ctx: CanonicalCtx): string => {
  if (doc.scix_id) {
    record({
      reason: 'backend-requires-bibcode',
      surface: ctx.surface,
      bibcode: doc.bibcode,
      scixId: doc.scix_id,
    });
  }
  return doc.bibcode ?? '';
};
