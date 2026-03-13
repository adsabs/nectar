import type { IADSApiSearchParams } from '@/api/search/types';
import type { SearchQueryParams } from './useSearchQueryParams';
import { filterBoundFq } from './filterBoundFq';

/**
 * Convert nuqs SearchQueryParams to a clean IADSApiSearchParams suitable for
 * Solr API requests. Strips nuqs-only fields (p, d, showHighlights) that are
 * not valid Solr parameters and would cause HTTP 400 errors.
 *
 * extraSolrParams contains dynamic URL params not managed by nuqs — e.g.
 * fq_range, fq_author_facet_hier — that are required by Solr local params
 * patterns such as `fq={!type=aqp v=$fq_range}`.
 *
 * Also strips any local-params fq entries whose binding variable is not
 * present in extraSolrParams. This prevents a transient race condition
 * (one render where nuqs still holds `{!type=aqp v=$fq_range}` but
 * router.query has already dropped `fq_range`) from producing a 400.
 *
 * @param params          - The nuqs URL state object from useSearchQueryParams
 * @param start           - Precomputed Solr start offset ((p - 1) * rows)
 * @param extraSolrParams - Dynamic non-nuqs URL params to forward to Solr
 */
export const toApiParams = (
  params: SearchQueryParams,
  start: number,
  extraSolrParams?: Record<string, string | string[]> | null,
): IADSApiSearchParams => ({
  q: params.q,
  sort: params.sort,
  rows: params.rows,
  fq: filterBoundFq(params.fq, extraSolrParams),
  start,
  ...extraSolrParams,
});
