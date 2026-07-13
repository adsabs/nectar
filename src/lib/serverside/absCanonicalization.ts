import { dehydrate, QueryClient } from '@tanstack/react-query';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import * as Sentry from '@sentry/nextjs';

import { ApiTargets } from '@/api/models';
import { searchKeys } from '@/api/search/search';
import { getAbstractParams } from '@/api/search/models';
import { IADSApiSearchResponse, IDocsEntity } from '@/api/search/types';
import { stringifySearchParams } from '@/utils/common/search';
import { pickTracingHeaders } from '@/config';
import { bootstrap } from './bootstrap';
import { fetchWithRetry } from './fetchWithRetry';
import { logger } from '@/logger';
import { composeNextGSSP } from '@/ssr-utils';
import { isAuthenticated } from '@/api/api';
import { ErrorSeverity, ErrorSource, handleError } from '@/lib/errorHandler';
import { trackUserFlow, PERF_SPANS } from '@/lib/performance';
import { AbsSSRResult } from '@/lib/abs/absRecordState';

const log = logger.child({ module: 'abs-canonical' }, { msgPrefix: '[abs-canonical] ' });

const SSR_FETCH_RETRIES = 2;
const SSR_FETCH_BACKOFF_MS = 150;

type AbsProps = {
  dehydratedState?: unknown;
  initialDoc?: IDocsEntity | null;
  isAuthenticated?: boolean;
  queryId: string;
  ssr: AbsSSRResult;
};

const addOutcomeBreadcrumb = (data: Record<string, unknown>) => {
  Sentry.addBreadcrumb({ category: 'abs-ssr', level: 'info', message: 'abs-ssr-outcome', data });
};

const absErrorProps = (
  queryId: string,
  statusCode: number,
  reason: string,
  isAuthenticated?: boolean,
): { props: AbsProps } => ({
  props: { initialDoc: null, isAuthenticated, queryId, ssr: { outcome: 'error', statusCode, reason } },
});

// composeNextGSSP sets a cache header on every response before we run; mark
// negatives non-cacheable so a transient error/not-found isn't edge-cached and
// served stale (setHeader replaces).
const setNoStore = (ctx: GetServerSidePropsContext) => {
  ctx.res.setHeader('Cache-Control', 'no-store');
};

type IncomingGSSPResult = GetServerSidePropsResult<AbsProps>;
type IncomingGSSP = (
  ctx: GetServerSidePropsContext,
  prevResult: GetServerSidePropsResult<Record<string, unknown>>,
) => Promise<IncomingGSSPResult>;

type ViewPathResolver = string | ((ctx: GetServerSidePropsContext) => string);

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    handleError(error, {
      source: ErrorSource.SERVER,
      severity: ErrorSeverity.WARNING,
      context: { value },
      tags: { feature: 'abs-canonical', stage: 'decode' },
    });
    return value;
  }
};

const extractIdentifierFromPath = (ctx: GetServerSidePropsContext, viewPath: string): string => {
  const rawFromParams = Array.isArray(ctx.params?.id) ? ctx.params?.id.join('/') : (ctx.params?.id as string) ?? '';
  try {
    const requestUrl = new URL(ctx.req.url ?? ctx.resolvedUrl, 'http://adsabs.local');
    const marker = '/abs/';
    const viewSuffix = `/${viewPath}`;
    const markerIndex = requestUrl.pathname.indexOf(marker);
    const viewIndex = requestUrl.pathname.lastIndexOf(viewSuffix);

    if (markerIndex > -1 && viewIndex > markerIndex) {
      return requestUrl.pathname.slice(markerIndex + marker.length, viewIndex);
    }
  } catch (error) {
    handleError(error, {
      source: ErrorSource.SERVER,
      severity: ErrorSeverity.WARNING,
      context: { url: ctx.req.url, resolvedUrl: ctx.resolvedUrl, viewPath },
      tags: { feature: 'abs-canonical', stage: 'path-parse' },
    });
  }

  return rawFromParams;
};

const buildRedirect = ({
  canonicalIdentifier,
  viewPath,
  search,
}: {
  canonicalIdentifier: string;
  viewPath: string;
  search: string;
}) => {
  return `/abs/${encodeURIComponent(canonicalIdentifier)}/${viewPath}${search ?? ''}`;
};

const resolveViewPath = (viewPathResolver: ViewPathResolver, ctx: GetServerSidePropsContext) =>
  typeof viewPathResolver === 'function' ? viewPathResolver(ctx) : viewPathResolver;

const absCanonicalize = (viewPathResolver: ViewPathResolver): IncomingGSSP => {
  return async (ctx) => {
    const viewPath = resolveViewPath(viewPathResolver, ctx);
    const rawId = extractIdentifierFromPath(ctx, viewPath);
    const requestedId = safeDecode(rawId);

    const bootstrapResult = await bootstrap(ctx.req, ctx.res);
    if (bootstrapResult.error) {
      const error = new Error('Bootstrap failed during abstract SSR');
      handleError(error, {
        source: ErrorSource.SERVER,
        context: { bootstrapError: bootstrapResult.error, url: ctx.resolvedUrl },
        tags: { feature: 'abs-canonical', stage: 'bootstrap' },
      });
      addOutcomeBreadcrumb({ requestedId, viewPath, outcome: 'error', stage: 'bootstrap', statusCode: 500 });
      setNoStore(ctx);
      return absErrorProps(requestedId, 500, 'bootstrap-failed');
    }

    const params = getAbstractParams(requestedId);
    const url = new URL(`${process.env.API_HOST_SERVER}${ApiTargets.SEARCH}`);
    url.search = stringifySearchParams(params);

    const queryClient = new QueryClient();

    try {
      const tracingHeaders = pickTracingHeaders(ctx.req.headers);
      const requestInit: RequestInit = {
        headers: {
          Authorization: `Bearer ${bootstrapResult.token.access_token}`,
          ...tracingHeaders,
        },
      };
      const spanName =
        viewPath === 'citations'
          ? PERF_SPANS.ABSTRACT_CITATIONS_LOAD
          : viewPath === 'references'
          ? PERF_SPANS.ABSTRACT_REFERENCES_LOAD
          : PERF_SPANS.ABSTRACT_LOAD_TOTAL;
      const response = await trackUserFlow(spanName, () =>
        fetchWithRetry(url, requestInit, {
          retries: SSR_FETCH_RETRIES,
          backoffMs: SSR_FETCH_BACKOFF_MS,
          onAttempt: ({ attempt, status, error, willRetry }) =>
            Sentry.addBreadcrumb({
              category: 'abs-ssr',
              level: willRetry ? 'warning' : 'info',
              message: 'abs-ssr-fetch-attempt',
              data: { requestedId, viewPath, attempt, status, willRetry, error: error ? String(error) : undefined },
            }),
        }),
      );

      if (!response.ok) {
        // Upstream 4xx/5xx are errors, never not-found. Absence is a 200 with zero
        // docs (below).
        const error = new Error(`Abstract fetch failed with status ${response.status}`);
        handleError(error, {
          source: ErrorSource.SERVER,
          context: {
            status: response.status,
            statusText: response.statusText,
            url: url.toString(),
            requestedId,
            viewPath,
          },
          tags: { feature: 'abs-canonical', stage: 'fetch' },
        });
        addOutcomeBreadcrumb({ requestedId, viewPath, outcome: 'error', stage: 'fetch', statusCode: response.status });
        setNoStore(ctx);
        return absErrorProps(requestedId, response.status, 'fetch-not-ok', isAuthenticated(bootstrapResult.token));
      }

      const data = (await response.json()) as IADSApiSearchResponse;
      queryClient.setQueryData(searchKeys.abstract(requestedId), data);

      const initialDoc = data?.response?.docs?.[0] ?? null;

      // Some Wiley DOIs end with '#', which browsers strip as a URL fragment when the
      // character is not percent-encoded. Retry once with '#' appended and redirect to
      // the canonical bibcode URL so the page always loads correctly.
      // Scoped to DOIs only (10.NNNN/ prefix) to avoid the extra round-trip for
      // bibcodes, arXiv IDs, and other identifiers that can never end with '#'.
      const isDoi = /^10\.\d{4,}\//.test(requestedId);
      if (!initialDoc && isDoi && !requestedId.endsWith('#')) {
        try {
          const retryId = requestedId + '#';
          const retryUrl = new URL(`${process.env.API_HOST_SERVER}${ApiTargets.SEARCH}`);
          retryUrl.search = stringifySearchParams(getAbstractParams(retryId));
          const retryResponse = await fetch(retryUrl, {
            headers: {
              Authorization: `Bearer ${bootstrapResult.token.access_token}`,
              ...tracingHeaders,
            },
          });
          if (retryResponse.ok) {
            const retryData = (await retryResponse.json()) as IADSApiSearchResponse;
            const retryDoc = retryData?.response?.docs?.[0] ?? null;
            if (retryDoc?.bibcode) {
              const requestUrl = new URL(ctx.req.url ?? ctx.resolvedUrl, 'http://adsabs.local');
              log.info({ requestedId, retryId, bibcode: retryDoc.bibcode, viewPath }, 'Hash fallback redirect');
              return {
                redirect: {
                  destination: buildRedirect({
                    canonicalIdentifier: retryDoc.bibcode,
                    viewPath,
                    search: requestUrl.search,
                  }),
                  statusCode: 302,
                },
              };
            }
          }
        } catch (retryError) {
          log.warn({ err: retryError, requestedId }, 'Hash fallback retry failed');
        }
      }

      const canonicalIdentifier = initialDoc?.bibcode;

      if (canonicalIdentifier && canonicalIdentifier !== requestedId) {
        log.info({ requestedId, canonicalIdentifier, viewPath }, 'Redirecting to canonical identifier');
        const requestUrl = new URL(ctx.req.url ?? ctx.resolvedUrl, 'http://adsabs.local');
        return {
          redirect: {
            destination: buildRedirect({ canonicalIdentifier, viewPath, search: requestUrl.search }),
            statusCode: 302,
          },
        };
      }

      if (!initialDoc) {
        // Confirmed empty (200, zero docs). Seed the cache so the client agrees, but
        // don't edge-cache a negative.
        addOutcomeBreadcrumb({ requestedId, viewPath, outcome: 'not-found', statusCode: 200 });
        setNoStore(ctx);
        return {
          props: {
            dehydratedState: dehydrate(queryClient),
            initialDoc: null,
            isAuthenticated: isAuthenticated(bootstrapResult.token),
            queryId: requestedId,
            ssr: { outcome: 'not-found' },
          },
        };
      }

      // Only edge-cache confirmed found records.
      ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      addOutcomeBreadcrumb({ requestedId, viewPath, outcome: 'found', statusCode: 200, bibcode: initialDoc.bibcode });
      return {
        props: {
          dehydratedState: dehydrate(queryClient),
          initialDoc,
          isAuthenticated: isAuthenticated(bootstrapResult.token),
          queryId: requestedId,
          ssr: { outcome: 'found' },
        },
      };
    } catch (error) {
      handleError(error, {
        source: ErrorSource.SERVER,
        context: { url: url.toString(), requestedId, viewPath },
        tags: { feature: 'abs-canonical', stage: 'fetch' },
      });
      addOutcomeBreadcrumb({ requestedId, viewPath, outcome: 'error', stage: 'fetch-throw', statusCode: 500 });
      setNoStore(ctx);
      return absErrorProps(requestedId, 500, 'fetch-threw', isAuthenticated(bootstrapResult.token));
    }
  };
};

export const createAbsGetServerSideProps = (viewPathResolver: ViewPathResolver) => {
  const composed = composeNextGSSP(absCanonicalize(viewPathResolver));
  return async (ctx: GetServerSidePropsContext): Promise<IncomingGSSPResult> => {
    const result = await composed(ctx);
    if ('redirect' in result) {
      return { redirect: result.redirect };
    }
    if ('notFound' in result) {
      return { notFound: result.notFound };
    }
    // composeNextGSSP widens props to Record<string, unknown>; here the shape is
    // always AbsProps, so restore the concrete return type.
    return result as IncomingGSSPResult;
  };
};
