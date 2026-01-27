import * as Sentry from '@sentry/nextjs';

export type ResultCountBucket = '0' | '1-10' | '11-100' | '100+';
export type QueryType = 'simple' | 'fielded' | 'boolean';

export interface PerformanceSpanTags {
  query_type?: QueryType;
  result_count_bucket?: ResultCountBucket;
  [key: string]: string | undefined;
}

export async function trackUserFlow<T>(name: string, fn: () => Promise<T>, tags?: PerformanceSpanTags): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'user.flow',
      attributes: tags,
    },
    async (span) => {
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
}

export function startRenderSpan(name: string, tags?: PerformanceSpanTags): { end: () => void } {
  const span = Sentry.startInactiveSpan({
    name,
    op: 'ui.render',
    attributes: tags,
  });

  return {
    end: () => span?.end(),
  };
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
} as const;
