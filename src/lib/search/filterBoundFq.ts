/**
 * Matches Solr local-params fq entries that reference a variable binding,
 * e.g. `{!type=aqp v=$fq_range}` — capturing the variable name (`fq_range`).
 */
const LOCAL_PARAMS_RE = /^\{!type=aqp\s+v=\$(\w+)\}/;

/**
 * Filter out fq entries whose local-params variable binding is absent from
 * extraSolrParams. This prevents a transient race condition (one render where
 * nuqs still holds `{!type=aqp v=$fq_range}` but router.query has already
 * dropped `fq_range`, leaving extraSolrParams null) from sending an
 * unresolvable local-params reference to Solr and getting a 400.
 *
 * Regular (non-local-params) fq entries are always kept.
 */
export const filterBoundFq = (fq: string[], extraSolrParams?: Record<string, string | string[]> | null): string[] =>
  fq.filter((entry) => {
    const match = LOCAL_PARAMS_RE.exec(entry);
    if (match) {
      const varName = match[1]; // e.g. "fq_range"
      return extraSolrParams != null && varName in extraSolrParams;
    }
    return true;
  });
