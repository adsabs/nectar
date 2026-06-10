/**
 * Doctypes permitted to emit Google Scholar-compatible meta tags on the
 * abstract page. "Google Scholar-compatible" covers the Highwire
 * (citation_*), PRISM (prism.*), and Dublin Core (dc.*) tag families.
 *
 * Only these doctypes display the tags; any other or unknown doctype omits
 * them. The Schema.org JSON-LD block is emitted for all records regardless
 * and is intentionally not gated by this list.
 */
export const GOOGLE_SCHOLAR_DOCTYPES: ReadonlySet<string> = new Set([
  'article',
  'eprint',
  'phdthesis',
  'circular',
  'inbook',
  'erratum',
  'book',
  'mastersthesis',
  'inproceedings',
  'abstract',
  'techreport',
  'bookreview',
  'proceedings',
  'editorial',
  'newsletter',
  'obituary',
]);

/**
 * Returns true when the given doctype should display Google
 * Scholar-compatible meta tags. Comparison is case-insensitive to
 * tolerate inconsistent casing in upstream data.
 */
export const showsGoogleScholarTags = (doctype?: string): boolean => {
  if (!doctype) {
    return false;
  }
  return GOOGLE_SCHOLAR_DOCTYPES.has(doctype.toLowerCase());
};
