import { NextRequest, NextResponse } from 'next/server';
import { edgeLogger as logger } from '@/logger';

const SEARCH_SUB_ROUTES = new Set([
  'exportcitation',
  'authoraffiliations',
  'citation_helper',
  'author_network',
  'concept_cloud',
  'overview',
  'paper_network',
  'results_graph',
  'metrics',
]);

/**
 * Determines whether this is a legacy-style /search/q=... path
 * that should be redirected to a real query string format.
 */
export function isLegacySearchURL(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;

  // Only handle /search/<something>
  if (!pathname.startsWith('/search/')) {
    return false;
  }

  const afterSearch = pathname.slice('/search/'.length); // e.g. "q=star"
  const firstSegment = afterSearch.split('/')[0];

  if (!afterSearch || SEARCH_SUB_ROUTES.has(firstSegment)) {
    return false;
  }

  // Log only a single entry when legacy redirect will happen
  logger.debug({ pathname }, 'Legacy /search path detected for redirect');

  return true;
}

/**
 * Redirects a legacy-style /search/q=...&fl=... URL to a canonical /search?q=...&fl=... format.
 * Assumes `isLegacySearchURL()` has already been used to determine eligibility.
 */
export function legacySearchURLMiddleware(req: NextRequest): NextResponse {
  const pathname = req.nextUrl.pathname;
  const rawSearch = req.nextUrl.search;

  const afterSearch = pathname.slice('/search/'.length);
  const rawLegacy = afterSearch + (rawSearch || '');
  const decodedParams = new URLSearchParams(
    rawLegacy.startsWith('?') ? rawLegacy : `?${rawLegacy.replace(/\+/g, ' ')}`,
  );

  const url = req.nextUrl.clone();
  url.pathname = '/search';
  url.search = decodedParams.toString();

  logger.debug({ redirectTo: url.toString() }, 'Redirecting legacy /search URL to canonical /search');

  return NextResponse.redirect(url, req);
}
