import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';
import { VizPageLayout } from '@components';
import { MetricsPageContainer } from '@components';
import { parseQueryFromUrlNoPage } from '@utils';
import { searchKeys } from '@_api/search';
import { getSearchParams } from '@_api/search/models';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { dehydrate, DehydratedState, QueryClient } from 'react-query';

const limit = 7000;
interface IMetricsProps {
  query?: ParsedUrlQuery;
  qid?: string;
  numFound?: number;
  dehydratedState?: DehydratedState;
  error?: string;
}

const MetricsPage: NextPage<IMetricsProps> = (props) => {
  const { query, qid, numFound, error } = props;
  return (
    <VizPageLayout vizPage="metrics" from={{ pathname: '/search', query: query }}>
      {error ? (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching records!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <MetricsPageContainer query={query} qid={qid} recordsToGet={numFound} />
      )}
    </VizPageLayout>
  );
};

export const getServerSideProps: GetServerSideProps<IMetricsProps> = async (ctx) => {
  const api = (await import('@_api/api')).default;
  const { fetchSearch } = await import('@_api/search');
  const { qid, ...query } = ctx.query;
  api.setToken(ctx.req.session.userData.access_token);
  const queryClient = new QueryClient();

  try {
    // get numbers of records count for this query
    const params = qid
      ? getSearchParams({ q: `docs(${qid as string})` })
      : getSearchParams({ ...parseQueryFromUrlNoPage(query) });
    const numFoundRes = await queryClient.fetchQuery({
      queryKey: searchKeys.primary(params),
      queryFn: fetchSearch,
      meta: { params },
      retry: false,
    });

    const numFound = Math.min(numFoundRes.response?.numFound ?? 0, limit);

    // prefetch the list of bibcodes for this query
    let remainsToFetch = numFound;
    let start = 0;
    while (remainsToFetch > 0) {
      const p = qid
        ? { q: `docs(${qid as string})`, start: start, rows: 1000, fl: ['bibcode'] }
        : { ...parseQueryFromUrlNoPage(query), start: start, rows: 1000, fl: ['bibcode'] };
      await queryClient.prefetchQuery({
        queryKey: searchKeys.primary(p),
        queryFn: fetchSearch,
        meta: { params: p },
        retry: false,
      });
      start += 1000;
      remainsToFetch -= 1000;
    }

    return {
      props: {
        query,
        qid: qid ? (qid as string) : null,
        numFound,
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (e) {
    return {
      props: {
        error: axios.isAxiosError(e) ? e.message : 'Unable to fetch data',
      },
    };
  }
};

export default MetricsPage;
