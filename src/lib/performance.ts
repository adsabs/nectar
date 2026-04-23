import * as Sentry from '@sentry/nextjs';
import type { IADSApiSearchParams } from '@/api/search/types';

export type ResultCountBucket = '0' | '1-10' | '11-100' | '100+';
export type QueryType = 'simple' | 'fielded' | 'boolean';

// Span slots: opened in Telemetry while the nav transaction is live, closed after paint.
// Each slot is a module-level singleton — client-only, one browser instance per process.
function makeSpanSlot(name: string, op: string) {
  let _span: ReturnType<typeof Sentry.startInactiveSpan> | null = null;
  return {
    open(): void {
      try {
        _span?.end();
        _span = Sentry.startInactiveSpan({ name, op });
      } catch {}
    },
    close(attrs?: Record<string, string | number | boolean>): void {
      if (!_span) {
        return;
      }
      try {
        if (attrs) {
          _span.setAttributes(attrs);
        }
        _span.setStatus({ code: 1 });
        _span.end();
      } catch {}
      _span = null;
    },
  };
}

const resultsSlot = makeSpanSlot('search.results.render', 'ui.render');
const facetsSlot = makeSpanSlot('search.facets.render', 'ui.render');
const fullTextSlot = makeSpanSlot('ux.full_text_time', 'user.flow');

export const openResultsRenderSpan = (): void => resultsSlot.open();
export const closeResultsRenderSpan = (docCount: number): void => resultsSlot.close({ doc_count: docCount });
export const openFacetsRenderSpan = (): void => facetsSlot.open();
export const closeFacetsRenderSpan = (): void => facetsSlot.close();
export const openFullTextTimingSpan = (): void => fullTextSlot.open();
export const closeFullTextTimingSpan = (): void => fullTextSlot.close();

export interface PerformanceSpanTags {
  query_type?: QueryType;
  result_count_bucket?: ResultCountBucket;
  [key: string]: string | undefined;
}

export async function trackUserFlow<T>(name: string, fn: () => Promise<T>, tags?: PerformanceSpanTags): Promise<T> {
  // `started` disambiguates Sentry-init failure (run fn bare) from fn throwing (rethrow).
  let started = false;
  try {
    return await Sentry.startSpan(
      {
        name,
        op: 'user.flow',
        attributes: tags,
      },
      async (span) => {
        started = true;
        try {
          const result = await fn();
          span.setStatus({ code: 1 });
          return result;
        } catch (error) {
          span.setStatus({
            code: 2,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
    );
  } catch (err) {
    if (!started) {
      return fn();
    }
    throw err;
  }
}

export function startRenderSpan(name: string, tags?: PerformanceSpanTags): { end: () => void } {
  try {
    const span = Sentry.startInactiveSpan({
      name,
      op: 'ui.render',
      attributes: tags,
    });

    return {
      end: () => {
        try {
          span?.end();
        } catch {
          // Silently ignore span end errors
        }
      },
    };
  } catch {
    return { end: () => undefined };
  }
}

export function getPageNumber(start = 0, rows = 10): number {
  return Math.floor(start / rows) + 1;
}

export function getResultCountBucket(count: number): ResultCountBucket {
  if (count === 0) {
    return '0';
  }
  if (count <= 10) {
    return '1-10';
  }
  if (count <= 100) {
    return '11-100';
  }
  return '100+';
}

export function getQueryType(query: string): QueryType {
  if (/\b(AND|OR|NOT)\b/.test(query)) {
    return 'boolean';
  }
  if (/\w+:/.test(query)) {
    return 'fielded';
  }
  return 'simple';
}

export const PERF_SPANS = {
  SEARCH_SUBMIT_TOTAL: 'search.submit.total',
  SEARCH_QUERY_REQUEST: 'search.query.request',
  SEARCH_RESULTS_RENDER: 'search.results.render',
  SEARCH_FACETS_RENDER: 'search.facets.render',
  SEARCH_PAGINATION_TOTAL: 'search.pagination.total',
  ABSTRACT_LOAD_TOTAL: 'abstract.load.total',
  ABSTRACT_METRICS_REQUEST: 'abstract.metrics.request',
  ABSTRACT_CITATIONS_LOAD: 'abstract.citations.load',
  ABSTRACT_REFERENCES_LOAD: 'abstract.references.load',
  EXPORT_GENERATE_TOTAL: 'export.generate.total',
  EXPORT_API_REQUEST: 'export.api.request',
  LIBRARY_LIST_LOAD: 'library.list.load',
  LIBRARY_ADD_TOTAL: 'library.add.total',
  LIBRARY_CREATE_TOTAL: 'library.create.total',
  AUTH_LOGIN_TOTAL: 'auth.login.total',
  AUTH_REGISTER_TOTAL: 'auth.register.total',
  AUTH_SESSION_VALIDATE: 'auth.session.validate',
  ORCID_OAUTH_TOTAL: 'orcid.oauth.total',
  ORCID_SYNC_TOTAL: 'orcid.sync.total',
  ORCID_CLAIM_TOTAL: 'orcid.claim.total',
  ORCID_PROFILE_LOAD: 'orcid.profile.load',
  UX_FULL_TEXT_TIME: 'ux.full_text_time',
} as const;

// Allowlist of structural Solr params safe to send as Sentry tags.
// Never include q, fq, fl, or hl — they contain raw user input and may hold PII.
const SAFE_QUERY_TAG_KEYS = new Set(['sort', 'start', 'rows', 'd', 'boostType']);

export function sendQueryAsTags(query: IADSApiSearchParams): void {
  for (const key of Object.keys(query)) {
    if (!SAFE_QUERY_TAG_KEYS.has(key)) {
      continue;
    }
    const raw = query[key];
    Sentry.setTag(`query.${key}`, Array.isArray(raw) ? raw.join(' | ') : JSON.stringify(raw));
  }
}
