import { spanToJSON } from '@sentry/nextjs';

// @sentry/nextjs doesn't re-export SpanJSON, so derive it from spanToJSON.
export type SpanJSON = ReturnType<typeof spanToJSON>;

// Known backend tiers (segment after /v1/). Anything else is clamped to `other`
// so a malformed path can never emit an arbitrary value as the tier label.
const API_DOMAINS = new Set([
  'search',
  'objects',
  'accounts',
  'vault',
  'biblib',
  'orcid',
  'export',
  'metrics',
  'resolver',
  'vis',
  'journals',
  'graphics',
  'reference',
  'citation_helper',
  'author-affiliation',
  'feedback',
]);

// A segment is dynamic (replaced with `{id}`) when it looks like an identifier
// or could carry PII; known static route words stay intact.
function isDynamicSegment(segment: string): boolean {
  // digits: ids, bibcodes, ORCIDs, issns, putcodes, qids
  if (/[0-9]/.test(segment)) {
    return true;
  }
  // uppercase: base64url library ids
  if (/[A-Z]/.test(segment)) {
    return true;
  }
  // emails, dotted ids, encoded free text
  if (/[@%.:,;]/.test(segment)) {
    return true;
  }
  // Long opaque tokens are ids, but plain lowercase route words (with `-`/`_`)
  // are static even when long — e.g. `site_wide_message`, `notification_query`.
  if (segment.length > 16 && !/^[a-z][a-z_-]*$/.test(segment)) {
    return true;
  }
  return false;
}

interface ParsedApiSpan {
  domain: string;
  endpoint: string;
}

function parseApiSpan(description: string): ParsedApiSpan | null {
  // Description is usually "<METHOD> <url-or-path>".
  const spaceIdx = description.indexOf(' ');
  const rawTarget = spaceIdx === -1 ? description : description.slice(spaceIdx + 1);

  let pathname: string;
  try {
    pathname = new URL(rawTarget).pathname;
  } catch {
    // Relative target: drop query and fragment manually.
    pathname = rawTarget.split(/[?#]/)[0];
  }

  const v1Idx = pathname.indexOf('/v1/');
  if (v1Idx === -1) {
    return null;
  }

  const segments = pathname
    .slice(v1Idx + '/v1/'.length)
    .split('/')
    .filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const [firstSegment] = segments;
  // Redact every dynamic segment, including the first, so an unknown segment
  // can't leak an id or PII. Domain still derives from the raw first segment.
  const endpointSegments = segments.map((segment) => (isDynamicSegment(segment) ? '{id}' : segment));

  return {
    domain: API_DOMAINS.has(firstSegment) ? firstSegment : 'other',
    endpoint: `/v1/${endpointSegments.join('/')}`,
  };
}

// Sentry beforeSendSpan: tags /v1/* http.client spans with low-cardinality
// api.domain / api.endpoint for grouping. Client spans only carry the full URL
// in description (url.path/http.route are null), so we derive both here.
export function beforeSendApiSpan(span: SpanJSON): SpanJSON {
  if (span.op !== 'http.client' || !span.description) {
    return span;
  }

  const parsed = parseApiSpan(span.description);
  if (!parsed) {
    return span;
  }

  span.data = {
    ...span.data,
    'api.domain': parsed.domain,
    'api.endpoint': parsed.endpoint,
  };
  return span;
}
