import { dehydrate, QueryClient } from '@tanstack/react-query';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { ApiTargets } from '@/api/models';
import { searchKeys } from '@/api/search/search';
import { getAbstractParams } from '@/api/search/models';
import { IADSApiSearchResponse, IDocsEntity } from '@/api/search/types';
import { stringifySearchParams } from '@/utils/common/search';
import { pickTracingHeaders } from '@/config';
import { bootstrap } from './bootstrap';
import { logger } from '@/logger';
import { composeNextGSSP } from '@/ssr-utils';
import { isAuthenticated } from '@/api/api';
import { ErrorSeverity, ErrorSource, handleError } from '@/lib/errorHandler';

const log = logger.child({ module: 'abs-canonical' }, { msgPrefix: '[abs-canonical] ' });

type AbsProps = {
  dehydratedState?: unknown;
  initialDoc?: IDocsEntity | null;
  isAuthenticated?: boolean;
  pageError?: string;
  statusCode?: number;
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
      return { props: { pageError: bootstrapResult.error, initialDoc: null, statusCode: 500 } };
    }

    const params = getAbstractParams(requestedId);
    const url = new URL(`${process.env.API_HOST_SERVER}${ApiTargets.SEARCH}`);
    url.search = stringifySearchParams(params);

    const queryClient = new QueryClient();

    try {
      const tracingHeaders = pickTracingHeaders(ctx.req.headers);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${bootstrapResult.token.access_token}`,
          ...tracingHeaders,
        },
      });

      if (!response.ok) {
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
        return {
          props: {
            pageError: 'Failed to load abstract data',
            initialDoc: null,
            statusCode: response.status,
          },
        };
      }

      const data = (await response.json()) as IADSApiSearchResponse;
      queryClient.setQueryData(searchKeys.abstract(requestedId), data);
      ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

      const initialDoc = data?.response?.docs?.[0] ?? null;
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

      return {
        props: {
          dehydratedState: dehydrate(queryClient),
          initialDoc,
          isAuthenticated: isAuthenticated(bootstrapResult.token),
        },
      };
    } catch (error) {
      handleError(error, {
        source: ErrorSource.SERVER,
        context: { url: url.toString(), requestedId, viewPath },
        tags: { feature: 'abs-canonical', stage: 'fetch' },
      });
      return {
        props: {
          pageError: 'Failed to load abstract data',
          initialDoc: null,
          statusCode: 500,
        },
      };
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
    return result;
  };
};
