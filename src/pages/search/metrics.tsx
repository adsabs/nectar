import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';

import { GetServerSideProps, NextPage } from 'next';
import { composeNextGSSP } from '@/ssr-utils';
import { logger } from '@/logger';
import { VizPageLayout } from '@/components/Layout';
import { MetricsPageContainer } from '@/components/Visualizations';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IADSApiSearchParams } from '@/api/search/types';

interface IMetricsProps {
  originalQuery: IADSApiSearchParams;
  bibsQuery: IADSApiSearchParams;
  error?: string;
}

const MetricsPage: NextPage<IMetricsProps> = (props) => {
  const { error, originalQuery, bibsQuery } = props;

  return (
    <VizPageLayout vizPage="metrics" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
      {error ? (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching records!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <MetricsPageContainer query={bibsQuery} />
      )}
    </VizPageLayout>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const BATCH_SIZE = 1000;
  const { ...originalQuery } = ctx.query;
  const { qid = null, ...query } = parseQueryFromUrl<{ qid: string }>(ctx.req.url, { sortPostfix: 'id asc' });

  // TODO: figure out why this clears the cache on transition
  // const queryClient = new QueryClient();

  try {
    // prefetch bibcodes from query

    const params: IADSApiSearchParams = {
      rows: BATCH_SIZE,
      fl: ['bibcode'],
      ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
    };

    // await queryClient.prefetchInfiniteQuery({
    //   queryKey: searchKeys.infinite(params),
    //   queryFn: fetchSearchInfinite,
    //   meta: { params },
    // });

    // react-query infinite queries cannot be serialized by next, currently.
    // see https://github.com/tannerlinsley/react-query/issues/3301#issuecomment-1041374043

    // const dehydratedState: DehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

    return Promise.resolve({
      props: {
        originalQuery,
        bibsQuery: params,
      },
    });
  } catch (error) {
    logger.error({ msg: 'GSSP error on metrics page', error });
    return Promise.resolve({
      props: {
        error: parseAPIError(error, { defaultMessage: 'Unable to fetch data' }),
        pageError: parseAPIError(error),
      },
    });
  }
});

export default MetricsPage;
