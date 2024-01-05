import {
  fetchGraphics,
  fetchMetrics,
  fetchSearch,
  fetchUserSettings,
  getAbstractParams,
  getCitationsParams,
  getCoreadsParams,
  getMetricsParams,
  getReferencesParams,
  getSimilarParams,
  getTocParams,
  graphicsKeys,
  metricsKeys,
  searchKeys,
  userKeys,
} from '@api';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { fetchLinks, resolverKeys } from '@api/resolver';

export const withDetailsPage = async (
  ctx: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
  const { id } = ctx.params as { id: string };
  const isAuthenticated = ctx.req.session?.isAuthenticated;

  const pathname = ctx.resolvedUrl.split('?')[0];
  const queryClient = new QueryClient();

  // Fetch all the data we need for the details page
  await Promise.allSettled([
    // primary abstract data
    queryClient.fetchQuery({
      queryKey: searchKeys.abstract(id),
      queryFn: fetchSearch,
      meta: { params: getAbstractParams(id) },
    }),

    // graphics
    queryClient.prefetchQuery({
      queryKey: graphicsKeys.primary(id),
      queryFn: fetchGraphics,
      meta: { params: { bibcode: id } },
    }),

    // metrics
    queryClient.prefetchQuery({
      queryKey: metricsKeys.primary([id]),
      queryFn: fetchMetrics,
      meta: { params: getMetricsParams([id]) },
    }),

    // associated works
    queryClient.prefetchQuery({
      queryKey: resolverKeys.links({ bibcode: id, link_type: 'associated' }),
      queryFn: fetchLinks,
      meta: { params: { bibcode: id, link_type: 'associated' } },
    }),

    // user settings (only if we're on the abstract page, and the user is logged in)
    isAuthenticated && pathname.endsWith('/abstract')
      ? queryClient.prefetchQuery({
          queryKey: userKeys.getUserSettings(),
          queryFn: fetchUserSettings,
        })
      : Promise.resolve(),

    // references (only if we're on the references page)
    pathname.endsWith('/references')
      ? queryClient.prefetchQuery({
          queryKey: searchKeys.references({ bibcode: id, start: 0 }),
          queryFn: fetchSearch,
          meta: { params: getReferencesParams(id, 0) },
        })
      : Promise.resolve(),

    // citations (only if we're on the citations page)
    pathname.endsWith('/citations')
      ? queryClient.prefetchQuery({
          queryKey: searchKeys.citations({ bibcode: id, start: 0 }),
          queryFn: fetchSearch,
          meta: { params: getCitationsParams(id, 0) },
        })
      : Promise.resolve(),

    // coreads (only if we're on the coreads page)
    pathname.endsWith('/coreads')
      ? queryClient.prefetchQuery({
          queryKey: searchKeys.coreads({ bibcode: id, start: 0 }),
          queryFn: fetchSearch,
          meta: { params: getCoreadsParams(id, 0) },
        })
      : Promise.resolve(),

    // similar (only if we're on the similar page)
    pathname.endsWith('/similar')
      ? queryClient.prefetchQuery({
          queryKey: searchKeys.similar({ bibcode: id, start: 0 }),
          queryFn: fetchSearch,
          meta: { params: getSimilarParams(id, 0) },
        })
      : Promise.resolve(),

    // toc (only if we're on the toc page)
    pathname.endsWith('/toc')
      ? queryClient.prefetchQuery({
          queryKey: searchKeys.toc({ bibcode: id, start: 0 }),
          queryFn: fetchSearch,
          meta: { params: getTocParams(id, 0) },
        })
      : Promise.resolve(),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
